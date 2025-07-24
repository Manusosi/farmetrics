import { useState, useEffect } from 'react';
import { Layout } from '@/components/common/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, MapPin, Camera, Navigation, Download, QrCode, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface APKFile {
  id: string;
  filename: string;
  version: string;
  description?: string | null;
  file_path: string;
  file_size?: number | null;
  download_count: number | null;
  created_at: string | null;
}

export function FieldOfficers() {
  const [activeAPK, setActiveAPK] = useState<APKFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Fetch active APK
  useEffect(() => {
    const fetchActiveAPK = async () => {
      try {
        const { data, error } = await supabase
          .from('apk_files')
          .select('*')
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching active APK:', error);
        } else if (data) {
          setActiveAPK(data);
        }
      } catch (error) {
        console.error('Error fetching active APK:', error);
      }
      setLoading(false);
    };

    fetchActiveAPK();
  }, []);

  // Handle APK download
  const handleDownload = async () => {
    if (!activeAPK) return;

    setDownloading(true);
    try {
      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from('apk-files')
        .createSignedUrl(activeAPK.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      if (data?.signedUrl) {
        // Increment download count
        await supabase
          .from('apk_files')
          .update({ download_count: (activeAPK.download_count || 0) + 1 })
          .eq('id', activeAPK.id);

        // Trigger download
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = activeAPK.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Download started!');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.');
    }
    setDownloading(false);
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Field Officers
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Mobile data collection for Ghana's agricultural monitoring system.
            </p>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Field officers are the backbone of our data collection system, visiting farms across Ghana 
              to gather accurate agricultural information using our specialized mobile application.
            </p>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Farmetrics Mobile App
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Purpose-built for field data collection with GPS tracking, offline capability, and seamless synchronization
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* App Features */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">
                Key Features
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">GPS Coordinate Collection</h4>
                    <p className="text-muted-foreground">
                      Automatically capture precise farm boundaries and polygon coordinates with built-in GPS functionality.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <Camera className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Geotagged Photography</h4>
                    <p className="text-muted-foreground">
                      Capture photos with EXIF data including GPS coordinates, timestamps, and device information.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-success/10 rounded-lg">
                    <Smartphone className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Offline Data Collection</h4>
                    <p className="text-muted-foreground">
                      Work seamlessly without internet connection and sync data when connectivity is restored.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-warning/10 rounded-lg">
                    <Navigation className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Farm Navigation</h4>
                    <p className="text-muted-foreground">
                      Built-in navigation to assigned farms with route optimization and visit tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Section */}
            <div>
              <Card className="shadow-medium">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Download className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Download Mobile App</CardTitle>
                  <CardDescription>
                    Get the Farmetrics mobile app for Android devices
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  {loading ? (
                    <div className="p-6 bg-muted/50 rounded-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : activeAPK ? (
                    <>
                      <div className="p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Smartphone className="h-8 w-8 text-green-600" />
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            v{activeAPK.version}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {formatFileSize(activeAPK.file_size)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              {activeAPK.download_count || 0} downloads
                            </div>
                          </div>
                          {activeAPK.created_at && (
                            <div className="flex items-center justify-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Updated {format(new Date(activeAPK.created_at), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                        {activeAPK.description && (
                          <p className="text-sm text-muted-foreground mt-4 p-3 bg-background rounded border">
                            {activeAPK.description}
                          </p>
                        )}
                      </div>
                      
                      <Button 
                        size="lg" 
                        className="w-full"
                        onClick={handleDownload}
                        disabled={downloading}
                      >
                        {downloading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-5 w-5 mr-2" />
                            Download APK v{activeAPK.version}
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="p-6 bg-muted/50 rounded-lg">
                      <QrCode className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        No APK available for download
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Please contact your administrator
                      </p>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>System Requirements:</p>
                    <p>• Android 6.0 or higher</p>
                    <p>• GPS capability required</p>
                    <p>• Camera permission needed</p>
                    <p>• 50MB storage space</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Field Officer Responsibilities */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Field Officer Responsibilities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Essential duties and activities performed by field officers during farm visits
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Farm Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Conduct regular visits to assigned farms, following scheduled routes and documenting 
                  farm conditions, crop status, and farmer interactions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Data Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Record comprehensive farm information including crop types, planting dates, 
                  farm boundaries, and polygon coordinates using the mobile app.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Photo Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Capture geotagged photos of farms, crops, and relevant agricultural features 
                  with proper EXIF data for verification purposes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg">GPS Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Map farm boundaries using GPS coordinates, creating accurate polygon 
                  representations of agricultural areas for geographic information systems.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ensure data accuracy, verify farmer information, cross-check coordinates, 
                  and maintain high standards for all collected information.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Reporting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Submit regular reports to supervisors, communicate issues or challenges, 
                  and maintain transparent documentation of all field activities.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-500 to-emerald-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Need Support?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Field officers can contact their regional supervisors or administrators for technical support, 
            training, or assistance with the mobile application.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-slate-700 hover:bg-slate-800 text-white border-0"
              size="xl"
            >
              Technical Support
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="border-white text-white hover:bg-white hover:text-emerald-600 bg-transparent"
            >
              Training Resources
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}