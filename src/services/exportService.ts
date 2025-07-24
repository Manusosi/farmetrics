import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  data: any[];
  filename: string;
  title?: string;
  headers?: string[];
  includeTimestamp?: boolean;
}

class ExportService {
  // Export data in specified format
  async exportData(options: ExportOptions): Promise<void> {
    const { format, data, filename, title, headers, includeTimestamp = true } = options;
    
    const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
    const fullFilename = `${filename}${timestamp}`;

    switch (format) {
      case 'excel':
        await this.exportToExcel(data, fullFilename, title, headers);
        break;
      case 'csv':
        await this.exportToCSV(data, fullFilename);
        break;
      case 'pdf':
        await this.exportToPDF(data, fullFilename, title, headers);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Export to Excel
  private async exportToExcel(data: any[], filename: string, title?: string, headers?: string[]): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Add title if provided
      if (title) {
        XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' });
        XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: 'A2' }); // Empty row
        // Shift data down
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        range.s.r = 2;
        worksheet['!ref'] = XLSX.utils.encode_range(range);
      }

      // Set column widths
      const colWidths = headers?.map(() => ({ width: 20 })) || 
                      Object.keys(data[0] || {}).map(() => ({ width: 20 }));
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      // Generate and download file
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  // Export to CSV
  private async exportToCSV(data: any[], filename: string): Promise<void> {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  // Export to PDF
  private async exportToPDF(data: any[], filename: string, title?: string, headers?: string[]): Promise<void> {
    try {
      const doc = new jsPDF();
      
      // Add title
      if (title) {
        doc.setFontSize(16);
        doc.text(title, 20, 20);
      }

      // Prepare table data
      const tableHeaders = headers || Object.keys(data[0] || {});
      const tableData = data.map(row => 
        tableHeaders.map(header => row[header] || '')
      );

      // Add table
      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: title ? 30 : 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        margin: { top: 20 }
      });

      // Add footer with timestamp
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
          20,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  // Export farmers data
  async exportFarmers(format: 'excel' | 'csv' | 'pdf' = 'excel'): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select(`
          name,
          phone_number,
          region,
          district,
          location,
          created_at
        `)
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

      await this.exportData({
        format,
        data: formattedData,
        filename: 'farmers_export',
        title: 'Farmers Database Export',
        headers: ['Name', 'Phone Number', 'Region', 'District', 'Location', 'Registered']
      });
    } catch (error) {
      console.error('Error exporting farmers:', error);
      throw error;
    }
  }

  // Export farms data
  async exportFarms(format: 'excel' | 'csv' | 'pdf' = 'excel'): Promise<void> {
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

      await this.exportData({
        format,
        data: formattedData,
        filename: 'farms_export',
        title: 'Farms Database Export'
      });
    } catch (error) {
      console.error('Error exporting farms:', error);
      throw error;
    }
  }

  // Export visits data
  async exportVisits(format: 'excel' | 'csv' | 'pdf' = 'excel'): Promise<void> {
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
          profiles(full_name)
        `)
        .order('visit_date', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(visit => ({
        'Visit Date': new Date(visit.visit_date).toLocaleDateString(),
        'Visit #': visit.visit_number,
        'Farm': visit.farms?.farm_name || 'Unknown',
        'Farmer': visit.farms?.farmers?.name || 'Unknown',
        'Officer': visit.profiles?.full_name || 'Unknown',
        'Crop Type': visit.crop_type || 'N/A',
        'Tree Count': visit.tree_count || 'N/A',
        'Farm Health': visit.farm_health || 'N/A',
        'Soil Type': visit.soil_type || 'N/A',
        'Humidity': visit.humidity || 'N/A',
        'Pests': visit.pests?.join(', ') || 'None',
        'Status': visit.is_approved ? 'Approved' : 'Pending',
        'Notes': visit.notes || 'None'
      })) || [];

      await this.exportData({
        format,
        data: formattedData,
        filename: 'visits_export',
        title: 'Visits Database Export'
      });
    } catch (error) {
      console.error('Error exporting visits:', error);
      throw error;
    }
  }

  // Export field officers data
  async exportFieldOfficers(format: 'excel' | 'csv' | 'pdf' = 'excel'): Promise<void> {
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

      await this.exportData({
        format,
        data: formattedData,
        filename: 'field_officers_export',
        title: 'Field Officers Database Export'
      });
    } catch (error) {
      console.error('Error exporting field officers:', error);
      throw error;
    }
  }

  // Export issues data
  async exportIssues(format: 'excel' | 'csv' | 'pdf' = 'excel'): Promise<void> {
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

      await this.exportData({
        format,
        data: formattedData,
        filename: 'issues_export',
        title: 'Issues Database Export'
      });
    } catch (error) {
      console.error('Error exporting issues:', error);
      throw error;
    }
  }

  // Generate comprehensive system report
  async generateSystemReport(format: 'excel' | 'pdf' = 'pdf'): Promise<void> {
    try {
      if (format === 'pdf') {
        const doc = new jsPDF();
        
        // Title page
        doc.setFontSize(20);
        doc.text('Farmetrics System Report', 20, 30);
        doc.setFontSize(12);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 45);

        // Get summary data
        const [farmersCount, farmsCount, visitsCount, officersCount] = await Promise.all([
          supabase.from('farmers').select('*', { count: 'exact', head: true }),
          supabase.from('farms').select('*', { count: 'exact', head: true }),
          supabase.from('visits').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'field_officer')
        ]);

        // Summary statistics
        doc.setFontSize(14);
        doc.text('System Overview', 20, 70);
        doc.setFontSize(10);
        doc.text(`Total Farmers: ${farmersCount.count || 0}`, 20, 85);
        doc.text(`Total Farms: ${farmsCount.count || 0}`, 20, 95);
        doc.text(`Total Visits: ${visitsCount.count || 0}`, 20, 105);
        doc.text(`Total Field Officers: ${officersCount.count || 0}`, 20, 115);

        doc.save(`farmetrics_system_report_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('Error generating system report:', error);
      throw error;
    }
  }
}

export const exportService = new ExportService(); 