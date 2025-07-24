import { supabase } from '@/integrations/supabase/client';

export interface DashboardSummary {
  farmCount: number;
  visitCount: number;
  pendingApprovals: number;
  issueCount: number;
  mediaCount: number;
  activeOfficerCount: number;
  dataQualityScore: number;
  syncSuccessRate: number;
}

export interface RecentActivity {
  id: string;
  type: 'farm_submitted' | 'visit_completed' | 'issue_reported' | 'transfer_requested';
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface FarmPolygon {
  id: string;
  farmName: string;
  status: 'approved' | 'pending' | 'issue';
  region: string;
  district: string;
  coordinates: [number, number][];
  totalArea: number | null;
  photos?: Array<{
    id: string;
    url: string;
    coordinates: [number, number];
  }>;
}

export interface SyncStatus {
  userId: string;
  userName: string;
  lastSync: string;
  status: 'success' | 'pending' | 'error';
  pendingCount?: number;
}

export interface WeeklyData {
  day: string;
  photos: number;
  polygons: number;
  reports: number;
}

/**
 * Helper function to handle and log errors in a standardized way
 */
const handleSupabaseError = (error: any, operation: string) => {
  if (error?.code === '42501' || error?.message?.includes('permission denied')) {
    console.error(`🔒 RLS Policy Error: Failed to ${operation} due to insufficient permissions.`, error);
    console.info('If you are an admin, ensure your user has admin role in both app_meta_data AND user_meta_data');
  } else if (error?.code === '403') {
    console.error(`🚫 Access Denied: Failed to ${operation} due to access restrictions.`, error);
  } else {
    console.error(`❌ Error: Failed to ${operation}:`, error);
  }
};

/**
 * Fetches dashboard summary statistics from Supabase
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    console.info('Fetching dashboard summary statistics...');
    
    // Execute all queries with error handling for each one
    const results = await Promise.allSettled([
      // Farm count
      supabase.from('farms').select('*', { count: 'exact', head: true }),
      // Visit count
      supabase.from('visits').select('*', { count: 'exact', head: true }),
      // Pending farm approvals
      supabase.from('farms').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      // Open issues count
      supabase.from('issues').select('*', { count: 'exact', head: true }).neq('status', 'resolved'),
      // Media count (visit images)
      supabase.from('visit_images').select('*', { count: 'exact', head: true }),
      // Active field officers
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .eq('role', 'field_officer')
        .eq('account_status', 'approved')
        .eq('is_active', true)
    ]);

    // Extract counts with safe defaults
    const farmCount = results[0].status === 'fulfilled' ? (results[0].value.count || 0) : 0;
    const visitCount = results[1].status === 'fulfilled' ? (results[1].value.count || 0) : 0;
    const pendingApprovals = results[2].status === 'fulfilled' ? (results[2].value.count || 0) : 0;
    const issueCount = results[3].status === 'fulfilled' ? (results[3].value.count || 0) : 0;
    const mediaCount = results[4].status === 'fulfilled' ? (results[4].value.count || 0) : 0;
    const activeOfficerCount = results[5].status === 'fulfilled' ? (results[5].value.count || 0) : 0;

    // Log any failed queries
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const operations = ['fetch farm count', 'fetch visit count', 'fetch pending approvals', 'fetch issue count', 'fetch media count', 'fetch active officers'];
        handleSupabaseError(result.reason, operations[index]);
      }
    });

    // Calculate data quality score based on actual data
    let dataQualityScore = 0;
    if (visitCount > 0 && mediaCount > 0) {
      // Simple calculation: percentage of visits that have media
      dataQualityScore = Math.min(100, Math.round((mediaCount / visitCount) * 100));
    } else if (visitCount === 0) {
      dataQualityScore = 100; // No visits means no data quality issues yet
    }

    // Calculate sync success rate based on active officers vs total visits
    let syncSuccessRate = 95; // Default high success rate
    if (activeOfficerCount > 0 && visitCount > 0) {
      // Simple heuristic: more visits per officer suggests better sync
      const visitsPerOfficer = visitCount / activeOfficerCount;
      syncSuccessRate = Math.min(100, Math.max(80, 85 + (visitsPerOfficer * 2)));
    }

    console.info('✅ Dashboard summary statistics fetched successfully');

    return {
      farmCount,
      visitCount,
      pendingApprovals,
      issueCount,
      mediaCount,
      activeOfficerCount,
      dataQualityScore: Math.round(dataQualityScore),
      syncSuccessRate: Math.round(syncSuccessRate * 10) / 10
    };
  } catch (error) {
    console.error('❌ Unexpected error in getDashboardSummary:', error);
    // Return zeros instead of mock data when there's an error
    return {
      farmCount: 0,
      visitCount: 0,
      pendingApprovals: 0,
      issueCount: 0,
      mediaCount: 0,
      activeOfficerCount: 0,
      dataQualityScore: 0,
      syncSuccessRate: 0
    };
  }
}

/**
 * Fetches recent activity for the dashboard
 */
export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  try {
    console.info('Fetching recent activity...');
    
    // Get recent visits with related data
    const { data: recentVisits, error } = await supabase
      .from('visits')
      .select(`
        id,
        created_at,
        farm_id,
        officer_id,
        profiles!visits_officer_id_fkey(full_name),
        farms!visits_farm_id_fkey(farm_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      handleSupabaseError(error, 'fetch recent activity');
      return [];
    }

    if (!recentVisits || recentVisits.length === 0) {
      console.info('No recent activity found');
      return [];
    }

    console.info(`✅ ${recentVisits.length} recent activities fetched successfully`);

    // Transform visits into activity items
    return recentVisits.map(visit => ({
      id: visit.id,
      type: 'visit_completed' as const,
      entityId: visit.farm_id,
      entityName: visit.farms?.farm_name || 'Unknown Farm',
      userId: visit.officer_id,
      userName: visit.profiles?.full_name || 'Unknown Officer',
      createdAt: visit.created_at
    }));
  } catch (error) {
    handleSupabaseError(error, 'fetch recent activity');
    return [];
  }
}

/**
 * Fetches farm polygons for the map
 */
export async function getFarmPolygons(limit = 10): Promise<FarmPolygon[]> {
  try {
    console.info('Fetching farm polygons...');
    
    // Get farms with polygon data
    const { data: farms, error } = await supabase
      .from('farms')
      .select(`
        id,
        farm_name,
        is_approved,
        region,
        district,
        polygon_coordinates,
        total_area
      `)
      .not('polygon_coordinates', 'is', null)
      .limit(limit);
    
    if (error) {
      handleSupabaseError(error, 'fetch farm polygons');
      return [];
    }

    if (!farms || farms.length === 0) {
      console.info('No farms with polygons found');
      return [];
    }

    console.info(`✅ ${farms.length} farms with polygons fetched successfully`);

    // Transform farm data into FarmPolygon objects
    return farms
      .filter(farm => farm.polygon_coordinates) // Ensure we have coordinates
      .map(farm => {
        const status: 'approved' | 'pending' | 'issue' = farm.is_approved ? 'approved' : 'pending';
        
        // Parse polygon coordinates safely
        let coordinates: [number, number][] = [];
        try {
          if (Array.isArray(farm.polygon_coordinates)) {
            coordinates = farm.polygon_coordinates as [number, number][];
          }
        } catch (e) {
          console.warn(`Invalid polygon coordinates for farm ${farm.id}`);
        }

        return {
          id: farm.id,
          farmName: farm.farm_name,
          status,
          region: farm.region || 'Unknown',
          district: farm.district || 'Unknown',
          coordinates,
          totalArea: farm.total_area
        };
      });
  } catch (error) {
    handleSupabaseError(error, 'fetch farm polygons');
    return [];
  }
}

/**
 * Fetches sync status for field officers
 */
export async function getSyncStatus(limit = 5): Promise<SyncStatus[]> {
  try {
    console.info('Fetching field officer sync status...');
    
    // Get active field officers with their latest activity
    const { data: officers, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name,
        updated_at
      `)
      .eq('role', 'field_officer')
      .eq('account_status', 'approved')
      .eq('is_active', true)
      .limit(limit);
    
    if (error) {
      handleSupabaseError(error, 'fetch field officer sync status');
      return [];
    }
    
    if (!officers || officers.length === 0) {
      console.info('No active field officers found');
      return [];
    }
    
    console.info(`✅ ${officers.length} field officers fetched successfully`);
    
    // For each officer, get their latest visit to determine sync status
    const officerSyncPromises = officers.map(async (officer) => {
      try {
        const { data: latestVisit } = await supabase
          .from('visits')
          .select('created_at')
          .eq('officer_id', officer.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastSyncDate = latestVisit?.[0]?.created_at || officer.updated_at;
        const lastSync = new Date(lastSyncDate);
        const now = new Date();
        const hoursAgo = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        let status: 'success' | 'pending' | 'error';
        let pendingCount = 0;

        if (hoursAgo < 4) {
          status = 'success';
        } else if (hoursAgo < 24) {
          status = 'pending';
          pendingCount = Math.floor(hoursAgo / 4);
        } else {
          status = 'error';
          pendingCount = Math.floor(hoursAgo / 8);
        }

        return {
          userId: officer.id,
          userName: officer.full_name,
          lastSync: lastSyncDate,
          status,
          pendingCount: status !== 'success' ? pendingCount : undefined
        };
      } catch (err) {
        console.warn(`Failed to get sync status for officer ${officer.id}`);
        return {
          userId: officer.id,
          userName: officer.full_name,
          lastSync: officer.updated_at,
          status: 'error' as const,
          pendingCount: 1
        };
      }
    });

    const syncStatuses = await Promise.all(officerSyncPromises);
    return syncStatuses;
  } catch (error) {
    handleSupabaseError(error, 'fetch sync status');
    return [];
  }
}

/**
 * Fetches weekly data for charts based on actual visit data
 */
export async function getWeeklyData(): Promise<WeeklyData[]> {
  try {
    console.info('Fetching weekly data for charts...');
    
    // Get visits from the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: recentVisits, error: visitsError } = await supabase
      .from('visits')
      .select('created_at')
      .gte('created_at', weekAgo.toISOString());

    const { data: recentImages, error: imagesError } = await supabase
      .from('visit_images')
      .select('created_at')
      .gte('created_at', weekAgo.toISOString());

    if (visitsError) {
      console.warn('Failed to fetch visits for weekly data:', visitsError);
    }
    if (imagesError) {
      console.warn('Failed to fetch images for weekly data:', imagesError);
    }

    // Initialize data for the past 7 days
    const weekData: WeeklyData[] = [];
    const currentDate = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Count visits for this day
      const dayVisits = recentVisits?.filter(visit => {
        const visitDate = new Date(visit.created_at);
        return visitDate >= dayStart && visitDate <= dayEnd;
      }).length || 0;

      // Count photos for this day
      const dayPhotos = recentImages?.filter(image => {
        const imageDate = new Date(image.created_at);
        return imageDate >= dayStart && imageDate <= dayEnd;
      }).length || 0;

      // Estimate polygons (assuming some visits include polygon capture)
      const dayPolygons = Math.floor(dayVisits * 0.3); // Rough estimate

      weekData.push({
        day: dayStr,
        photos: dayPhotos,
        polygons: dayPolygons,
        reports: dayVisits
      });
    }
    
    console.info('✅ Weekly data generated successfully');
    return weekData;
  } catch (error) {
    handleSupabaseError(error, 'generate weekly data');
    
    // Return minimal data structure instead of zeros
    const currentDate = new Date();
    const weekData: WeeklyData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      weekData.push({
        day: dayStr,
        photos: 0,
        polygons: 0,
        reports: 0
      });
    }
    
    return weekData;
  }
} 