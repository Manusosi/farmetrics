import { supabase } from '@/integrations/supabase/client';

interface SimpleExportOptions {
  data: any[];
  filename: string;
  format: 'csv' | 'json';
}

class SimpleExportService {
  // Simple CSV export without external dependencies
  exportToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that contain commas, quotes, or newlines
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  // Simple JSON export
  exportToJSON(data: any[], filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  // Export with format choice
  async export(options: SimpleExportOptions): Promise<void> {
    const { data, filename, format } = options;
    
    switch (format) {
      case 'csv':
        this.exportToCSV(data, filename);
        break;
      case 'json':
        this.exportToJSON(data, filename);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Export farmers data
  async exportFarmers(format: 'csv' | 'json' = 'csv'): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('name, phone_number, region, district, location, created_at')
        .order('name');

      if (error) throw error;

      const formattedData = data?.map(farmer => ({
        'Name': farmer.name,
        'Phone Number': farmer.phone_number || 'N/A',
        'Region': farmer.region,
        'District': farmer.district,
        'Location': farmer.location || 'N/A',
        'Registered': new Date(farmer.created_at).toLocaleDateString()
      })) || [];

      await this.export({
        data: formattedData,
        filename: 'farmers_export',
        format
      });
    } catch (error) {
      console.error('Error exporting farmers:', error);
      throw error;
    }
  }

  // Export farms data
  async exportFarms(format: 'csv' | 'json' = 'csv'): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select(`
          farm_name,
          crop_type,
          region,
          district,
          location,
          farm_size_approx,
          is_approved,
          visit_count,
          farmers(name),
          profiles(full_name)
        `)
        .order('farm_name');

      if (error) throw error;

      const formattedData = data?.map(farm => ({
        'Farm Name': farm.farm_name,
        'Farmer': farm.farmers?.name || 'Unknown',
        'Crop Type': farm.crop_type,
        'Region': farm.region,
        'District': farm.district,
        'Location': farm.location || 'N/A',
        'Size (Approx)': farm.farm_size_approx || 'N/A',
        'Status': farm.is_approved ? 'Approved' : 'Pending',
        'Visit Count': farm.visit_count,
        'Assigned Officer': farm.profiles?.full_name || 'Unassigned'
      })) || [];

      await this.export({
        data: formattedData,
        filename: 'farms_export',
        format
      });
    } catch (error) {
      console.error('Error exporting farms:', error);
      throw error;
    }
  }

  // Export visits data  
  async exportVisits(format: 'csv' | 'json' = 'csv'): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          visit_date,
          visit_number,
          visit_type,
          crop_type,
          tree_count,
          farm_health,
          soil_type,
          humidity,
          pests,
          notes,
          is_approved,
          farms(farm_name, farmers(name)),
          officer:profiles!officer_id(full_name)
        `)
        .order('visit_date', { ascending: false });

      if (error) throw error;

      const csvData = data.map(visit => ({
        'Visit Date': new Date(visit.visit_date).toLocaleDateString(),
        'Visit #': visit.visit_number,
        'Farm': visit.farms?.farm_name || 'Unknown',
        'Farmer': visit.farms?.farmers?.name || 'Unknown',
        'Officer': visit.officer?.full_name || 'Unknown',
        'Crop Type': visit.crop_type || 'N/A',
        'Tree Count': visit.tree_count || 'N/A',
        'Farm Health': visit.farm_health || 'N/A',
        'Soil Type': visit.soil_type || 'N/A',
        'Humidity': visit.humidity || 'N/A',
        'Pests': visit.pests?.join(', ') || 'None',
        'Notes': visit.notes || 'N/A',
        'Status': visit.is_approved ? 'Approved' : 'Pending'
      }));

      await this.export({
        data: csvData,
        filename: 'visits_export',
        format
      });
    } catch (error) {
      console.error('Error exporting visits:', error);
      throw error;
    }
  }

  // Export field officers data
  async exportFieldOfficers(format: 'csv' | 'json' = 'csv'): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          full_name,
          phone_number,
          region,
          district,
          account_status,
          is_active,
          created_at,
          approved_at
        `)
        .eq('role', 'field_officer')
        .order('full_name');

      if (error) throw error;

      const formattedData = data?.map(officer => ({
        'Name': officer.full_name,
        'Phone': officer.phone_number || 'N/A',
        'Region': officer.region || 'N/A',
        'District': officer.district || 'N/A',
        'Status': officer.account_status || 'Unknown',
        'Active': officer.is_active ? 'Yes' : 'No',
        'Registered': new Date(officer.created_at).toLocaleDateString(),
        'Approved': officer.approved_at ? new Date(officer.approved_at).toLocaleDateString() : 'Not approved'
      })) || [];

      await this.export({
        data: formattedData,
        filename: 'field_officers_export',
        format
      });
    } catch (error) {
      console.error('Error exporting field officers:', error);
      throw error;
    }
  }

  // Export issues data
  async exportIssues(format: 'csv' | 'json' = 'csv'): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          title,
          description,
          priority,
          status,
          created_at,
          resolved_at,
          farms(farm_name, region, farmers(name)),
          reported_by_profile:profiles!issues_reported_by_fkey(full_name),
          assigned_to_profile:profiles!issues_assigned_to_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(issue => ({
        'Title': issue.title,
        'Description': issue.description,
        'Priority': issue.priority,
        'Status': issue.status,
        'Farm': issue.farms?.farm_name || 'Unknown',
        'Farmer': issue.farms?.farmers?.name || 'Unknown',
        'Region': issue.farms?.region || 'Unknown',
        'Reported By': issue.reported_by_profile?.full_name || 'Unknown',
        'Assigned To': issue.assigned_to_profile?.full_name || 'Unassigned',
        'Created': new Date(issue.created_at).toLocaleDateString(),
        'Resolved': issue.resolved_at ? new Date(issue.resolved_at).toLocaleDateString() : 'Not resolved'
      })) || [];

      await this.export({
        data: formattedData,
        filename: 'issues_export',
        format
      });
    } catch (error) {
      console.error('Error exporting issues:', error);
      throw error;
    }
  }
}

export const simpleExportService = new SimpleExportService(); 