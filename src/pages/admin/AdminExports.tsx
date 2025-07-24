import { useState } from 'react';
import { exportService } from '@/services/exportService';
import { simpleExportService } from '@/services/simpleExportService';
import {
  Download, 
  FileText, 
  Users, 
  Sprout,
  MapPin,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  FileImage,
  Calendar,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ExportItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  exportFunction: (format: 'excel' | 'csv' | 'pdf') => Promise<void>;
  supportedFormats: ('excel' | 'csv' | 'pdf')[];
}

export function AdminExports() {
  const [loading, setLoading] = useState<string | null>(null);

  const exportItems: ExportItem[] = [
  {
      id: 'farmers',
      title: 'Farmers Database',
      description: 'Complete list of all registered farmers with contact information and location data',
      icon: Users,
      exportFunction: exportService.exportFarmers.bind(exportService),
      supportedFormats: ['excel', 'csv', 'pdf']
    },
    {
      id: 'farms',
      title: 'Farms Database', 
      description: 'All farms with crop types, locations, approval status, and assigned officers',
      icon: Sprout,
      exportFunction: exportService.exportFarms.bind(exportService),
      supportedFormats: ['excel', 'csv', 'pdf']
    },
    {
      id: 'visits',
      title: 'Visit Reports',
      description: 'Complete visit history with crop data, health assessments, and officer notes',
      icon: FileText,
      exportFunction: exportService.exportVisits.bind(exportService),
      supportedFormats: ['excel', 'csv', 'pdf']
    },
    {
      id: 'officers',
      title: 'Field Officers',
      description: 'All field officers with their approval status, regions, and activity data',
      icon: Users,
      exportFunction: exportService.exportFieldOfficers.bind(exportService),
      supportedFormats: ['excel', 'csv', 'pdf']
  },
  {
      id: 'issues',
      title: 'Issue Reports',
      description: 'All reported issues with status, priority, and resolution information',
      icon: AlertTriangle,
      exportFunction: exportService.exportIssues.bind(exportService),
      supportedFormats: ['excel', 'csv', 'pdf']
    }
  ];

  const handleExport = async (item: ExportItem, format: 'excel' | 'csv' | 'pdf') => {
    setLoading(`${item.id}-${format}`);
    try {
      // Try the full export service first, fallback to simple service for CSV
      if (format === 'csv') {
        try {
          await item.exportFunction(format);
        } catch (error) {
          console.warn('Falling back to simple CSV export:', error);
          // Fallback to simple export service
          const simpleFunction = (simpleExportService as any)[`export${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`];
          if (simpleFunction) {
            await simpleFunction.call(simpleExportService, 'csv');
          } else {
            throw error;
          }
        }
      } else {
        await item.exportFunction(format);
      }
      toast.success(`${item.title} exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${item.title}`);
    }
    setLoading(null);
  };

  const handleSystemReport = async (format: 'excel' | 'pdf' = 'pdf') => {
    setLoading(`system-${format}`);
    try {
      await exportService.generateSystemReport(format);
      toast.success('System report generated successfully');
    } catch (error) {
      console.error('System report error:', error);
      toast.error('Failed to generate system report');
    }
    setLoading(null);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv': return <FileText className="h-4 w-4" />;
      case 'pdf': return <FileImage className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'excel': return 'bg-green-600';
      case 'csv': return 'bg-blue-600';
      case 'pdf': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Exports</h1>
          <p className="text-muted-foreground">
            Export system data in various formats for reporting and analysis
          </p>
        </div>
      </div>

      {/* Quick Actions */}
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Reports
          </CardTitle>
            <CardDescription>
            Generate comprehensive system reports with all data
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => handleSystemReport('pdf')}
              disabled={loading === 'system-pdf'}
              className="flex items-center gap-2"
            >
              {loading === 'system-pdf' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileImage className="h-4 w-4" />
              )}
              Generate PDF Report
                </Button>
            <Button 
              variant="outline"
              onClick={() => handleSystemReport('excel')}
              disabled={loading === 'system-excel'}
              className="flex items-center gap-2"
            >
              {loading === 'system-excel' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Generate Excel Report
                </Button>
            </div>
          </CardContent>
        </Card>

      {/* Export Items */}
      <div className="grid gap-6 md:grid-cols-2">
        {exportItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card key={item.id} className="h-full">
          <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5 text-primary" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Available formats:</span>
                    <div className="flex gap-1">
                      {item.supportedFormats.map((format) => (
                        <Badge key={format} variant="outline" className="text-xs">
                          {format.toUpperCase()}
                        </Badge>
                      ))}
              </div>
              </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {item.supportedFormats.map((format) => (
                      <Button
                        key={format}
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(item, format)}
                        disabled={loading === `${item.id}-${format}`}
                        className="flex items-center gap-2"
                      >
                        {loading === `${item.id}-${format}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          getFormatIcon(format)
                        )}
                        Export {format.toUpperCase()}
                </Button>
                    ))}
              </div>
            </div>
          </CardContent>
        </Card>
          );
        })}
      </div>

      {/* Export Information */}
        <Card>
          <CardHeader>
          <CardTitle>Export Information</CardTitle>
            <CardDescription>
            Details about export formats and their use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-600"></div>
                <span className="font-medium">Excel (.xlsx)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Best for data analysis, pivot tables, and advanced calculations. Supports formatting and multiple sheets.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-600"></div>
                <span className="font-medium">CSV (.csv)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Universal format compatible with all spreadsheet applications. Ideal for data import/export.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-600"></div>
                <span className="font-medium">PDF (.pdf)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Perfect for reports, presentations, and sharing with stakeholders. Maintains formatting across devices.
              </p>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>All exports include timestamps in filenames for easy organization</span>
                        </div>
            <div className="flex items-start gap-2">
              <Download className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Files are downloaded directly to your default download folder</span>
                        </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Large datasets may take a few moments to process and download</span>
                      </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 