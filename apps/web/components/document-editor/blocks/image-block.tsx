'use client';

import { useState, useRef } from 'react';
import { Button, Input, Label } from '@countin/ui';
import { Image as ImageIcon, Upload, Link as LinkIcon } from 'lucide-react';
import { ImageBlock as ImageBlockType } from '../types';

interface ImageBlockProps {
  block: ImageBlockType;
  onChange: (updates: Partial<ImageBlockType>) => void;
  isActive: boolean;
}

export function ImageBlockComponent({ block, onChange, isActive }: ImageBlockProps) {
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to base64 for simple implementation
      // In production, you'd upload to a server/cloud storage
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ url: reader.result as string, alt: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!block.url) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <div className="flex justify-center gap-2 mb-4">
          <Button
            variant={inputMode === 'url' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('url')}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            URL
          </Button>
          <Button
            variant={inputMode === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('upload')}
          >
            <Upload className="w-4 h-4 mr-2" />
            업로드
          </Button>
        </div>
        {inputMode === 'url' ? (
          <div className="max-w-md mx-auto">
            <Input
              type="url"
              placeholder="이미지 URL을 입력하세요"
              onBlur={(e) => {
                if (e.target.value) {
                  onChange({ url: e.target.value });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value) {
                    onChange({ url: input.value });
                  }
                }
              }}
            />
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              파일 선택
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative group">
        <img
          src={block.url}
          alt={block.alt}
          className="max-w-full h-auto rounded-lg"
          style={{ maxWidth: block.width ? `${block.width}px` : '100%' }}
        />
        {isActive && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() => onChange({ url: '' })}
            >
              이미지 변경
            </Button>
          </div>
        )}
      </div>
      {isActive && (
        <div className="flex gap-4">
          <div className="flex-1">
            <Label className="text-xs">대체 텍스트</Label>
            <Input
              value={block.alt}
              onChange={(e) => onChange({ alt: e.target.value })}
              placeholder="이미지 설명"
              className="h-8 text-sm"
            />
          </div>
          <div className="w-32">
            <Label className="text-xs">너비 (px)</Label>
            <Input
              type="number"
              value={block.width || ''}
              onChange={(e) => onChange({ width: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="자동"
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
