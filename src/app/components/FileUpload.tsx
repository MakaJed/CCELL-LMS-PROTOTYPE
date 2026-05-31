import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Upload, File, Video, Music, X, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';

interface FileUploadProps {
  acceptedTypes: ('file' | 'video' | 'audio')[];
  onSubmit: (files: File[]) => void;
  maxFiles?: number;
  instructions?: string;
}

export function FileUpload({ acceptedTypes, onSubmit, maxFiles = 5, instructions }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptString = () => {
    const acceptMap = {
      file: '.pdf,.doc,.docx,.txt,.zip,.rar',
      video: '.mp4,.mov,.avi,.mkv,.webm',
      audio: '.mp3,.wav,.m4a,.ogg',
    };
    return acceptedTypes.map(type => acceptMap[type]).join(',');
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return <Video className="h-5 w-5 text-blue-500" />;
    if (file.type.startsWith('audio/')) return <Music className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, maxFiles - selectedFiles.length);
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onSubmit(selectedFiles);
      setSelectedFiles([]);
    }
  };

  return (
    <Card className="border-2 border-[#FFB300]/30">
      <CardContent className="pt-6">
        {instructions && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">{instructions}</p>
          </div>
        )}

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging
              ? 'border-[#FFB300] bg-[#FFF8E1]'
              : 'border-gray-300 hover:border-[#FFB300] hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-[#FFB300]' : 'text-gray-400'}`} />
          <p className="font-semibold text-gray-700 mb-2">
            Drag and drop your files here
          </p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={getAcceptString()}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="border-[#FFB300] text-[#FFB300] hover:bg-[#FFF8E1]"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            {acceptedTypes.includes('file') && (
              <Badge variant="outline" className="text-xs">
                <File className="h-3 w-3 mr-1" /> Documents
              </Badge>
            )}
            {acceptedTypes.includes('video') && (
              <Badge variant="outline" className="text-xs">
                <Video className="h-3 w-3 mr-1" /> Videos
              </Badge>
            )}
            {acceptedTypes.includes('audio') && (
              <Badge variant="outline" className="text-xs">
                <Music className="h-3 w-3 mr-1" /> Audio
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Max {maxFiles} files</p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="font-semibold text-sm text-gray-700 mb-2">Selected Files ({selectedFiles.length}/{maxFiles})</p>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}

            <Button
              onClick={handleSubmit}
              className="w-full bg-[#FFB300] hover:bg-[#FFC107] text-[#1A237E] font-bold gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Submit Assignment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
