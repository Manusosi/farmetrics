import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  Download,
  Smartphone,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface APKFile {
  id: string;
  filename: string;
  version: string;
  description?: string;
  file_path: string;
  file_size?: number;
  uploaded_by?: string;
  is_active: boolean;
  download_count: number;
  created_at: string;
  uploader?: {
    full_name: string;
  };
}

export function AdminAPKManager() {
  const { profile } = useAuth();
  const [apkFiles, setApkFiles] = useState<APKFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<APKFile | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');

  // Fetch APK files
  const fetchAPKFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apk_files')
        .select(`
          *,
          uploader:profiles!apk_files_uploaded_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching APK files:', error);
        // Only show error if it's not just empty data
        if (error.code !== 'PGRST116') {
          toast.error('Unable to access APK files');
        }
        return;
      }

      setApkFiles(data || []);
    } catch (error) {
      console.error('Error fetching APK files:', error);
      // Don't show error toast for empty data scenarios
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAPKFiles();
  }, []);

  // Handle file upload
  const handleUpload = async () => {
    if (!file || !version.trim()) {
      toast.error('Please select a file and enter a version');
      return;
    }

    if (!file.name.endsWith('.apk')) {
      toast.error('Please upload a valid APK file');
      return;
    }

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = 'apk';
      const fileName = `${Date.now()}-${version.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
      const filePath = `apk-files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('apk-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Create database record
      const { error: dbError } = await supabase
        .from('apk_files')
        .insert({
          filename: file.name,
          version: version.trim(),
          description: description.trim() || null,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: profile?.id,
          is_active: false // New uploads are inactive by default
        });

      if (dbError) {
        // Clean up uploaded file if DB insert fails
        await supabase.storage.from('apk-files').remove([filePath]);
        throw dbError;
      }

      toast.success('APK file uploaded successfully');
      setShowUploadDialog(false);
      setFile(null);
      setVersion('');
      setDescription('');
      await fetchAPKFiles();
    } catch (error: any) {
      console.error('Error uploading APK:', error);
      toast.error(`Upload failed: ${error.message}`);
    }
    setUploading(false);
  };

  // Toggle APK active status
  const toggleAPKStatus = async (apk: APKFile) => {
    try {
      // If activating this APK, deactivate all others first
      if (!apk.is_active) {
        await supabase
          .from('apk_files')
          .update({ is_active: false })
          .neq('id', apk.id);
      }

      const { error } = await supabase
        .from('apk_files')
        .update({ is_active: !apk.is_active })
        .eq('id', apk.id);

      if (error) throw error;

      toast.success(`APK ${apk.is_active ? 'deactivated' : 'activated'} successfully`);
      await fetchAPKFiles();
    } catch (error: any) {
      console.error('Error updating APK status:', error);
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  // Delete APK file
  const handleDelete = async () => {
    if (!selectedFile) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('apk-files')
        .remove([selectedFile.file_path]);

      // Delete from database
      const { error } = await supabase
        .from('apk_files')
        .delete()
        .eq('id', selectedFile.id);

      if (error) throw error;

      toast.success('APK file deleted successfully');
      setShowDeleteDialog(false);
      setSelectedFile(null);
      await fetchAPKFiles();
    } catch (error: any) {
      console.error('Error deleting APK:', error);
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Get active APK for public download
  const activeAPK = apkFiles.find(apk => apk.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">APK Management</h1>
          <p className="text-muted-foreground">
            Manage mobile app APK files for field officers
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload APK
        </Button>
      </div>

      {/* Active APK Info */}
      {activeAPK && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Currently Active APK
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              This APK is available for field officers to download
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Version</p>
                <p className="text-lg">{activeAPK.version}</p>
              </div>
              <div>
                <p className="text-sm font-medium">File Size</p>
                <p className="text-lg">{formatFileSize(activeAPK.file_size)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Downloads</p>
                <p className="text-lg">{activeAPK.download_count}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Uploaded</p>
                <p className="text-lg">{format(new Date(activeAPK.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
            {activeAPK.description && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{activeAPK.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* APK Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>All APK Files</CardTitle>
          <CardDescription>
            Manage uploaded APK files and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton 
              columns={7} 
              rows={3}
              headers={['Version', 'Filename', 'Size', 'Status', 'Downloads', 'Uploaded By', 'Date', 'Actions']}
            />
          ) : apkFiles.length === 0 ? (
            <div className="text-center py-8">
              <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No APK files uploaded yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowUploadDialog(true)}
              >
                Upload First APK
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apkFiles.map((apk) => (
                  <TableRow key={apk.id}>
                    <TableCell className="font-medium">{apk.version}</TableCell>
                    <TableCell>{apk.filename}</TableCell>
                    <TableCell>{formatFileSize(apk.file_size)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={apk.is_active ? "default" : "secondary"}
                        className={apk.is_active ? "bg-green-600" : ""}
                      >
                        {apk.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        {apk.download_count}
                      </div>
                    </TableCell>
                    <TableCell>{apk.uploader?.full_name || 'Uploader not available'}</TableCell>
                    <TableCell>{format(new Date(apk.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAPKStatus(apk)}
                        >
                          {apk.is_active ? (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(apk);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload New APK</DialogTitle>
            <DialogDescription>
              Upload a new version of the Farmetrics mobile app
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apk-file">APK File</Label>
              <Input
                id="apk-file"
                type="file"
                accept=".apk"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                placeholder="e.g., 1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What's new in this version..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {file && (
              <div className="text-sm text-muted-foreground">
                File: {file.name} ({formatFileSize(file.size)})
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete APK File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFile?.filename}"? 
              This action cannot be undone and will remove the file from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 