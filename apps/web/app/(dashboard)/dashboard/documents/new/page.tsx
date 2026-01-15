'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Calculator,
  Wallet,
  Users,
  FileSignature,
  Lightbulb,
  ClipboardList,
  File,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@countin/ui';

interface Project {
  id: string;
  name: string;
}

interface DocumentTemplate {
  id: string;
  title: string;
  type: string;
}

const DOCUMENT_TYPES = [
  {
    value: 'BUSINESS_PLAN',
    label: '사업계획서',
    description: '프로젝트 및 사업에 대한 계획 문서',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-600',
  },
  {
    value: 'SETTLEMENT',
    label: '정산서',
    description: '사업비 정산 및 결산 문서',
    icon: Calculator,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    value: 'BUDGET_PLAN',
    label: '예산안',
    description: '연간 또는 분기별 예산 계획',
    icon: Wallet,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    value: 'MEETING_MINUTES',
    label: '회의록',
    description: '회의 내용 기록 및 의사결정 사항',
    icon: Users,
    color: 'from-purple-500 to-violet-600',
  },
  {
    value: 'CONTRACT',
    label: '계약서',
    description: '용역, 구매, 협력 계약 문서',
    icon: FileSignature,
    color: 'from-rose-500 to-pink-600',
  },
  {
    value: 'PROPOSAL',
    label: '제안서',
    description: '사업 제안 및 기획 문서',
    icon: ClipboardList,
    color: 'from-cyan-500 to-sky-600',
  },
  {
    value: 'REPORT',
    label: '보고서',
    description: '사업 진행 및 결과 보고 문서',
    icon: FileText,
    color: 'from-slate-500 to-gray-600',
  },
  {
    value: 'CUSTOM',
    label: '기타',
    description: '분류되지 않는 기타 문서',
    icon: File,
    color: 'from-gray-400 to-slate-500',
  },
];

export default function NewDocumentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

  useEffect(() => {
    // Fetch projects
    fetch('/api/projects')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setProjects(result.data);
        }
      })
      .catch(console.error);

    // Fetch templates
    fetch('/api/documents?isTemplate=true')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setTemplates(result.data);
        }
      })
      .catch(console.error);
  }, []);

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    const typeInfo = DOCUMENT_TYPES.find((t) => t.value === type);
    if (typeInfo) {
      setTitle(`새 ${typeInfo.label}`);
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!title || !selectedType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type: selectedType,
          projectId: projectId || null,
          templateId: templateId || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/dashboard/documents/${result.data.id}/edit`);
      }
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(
    (t) => selectedType === 'all' || t.type === selectedType
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          문서
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">새 문서 만들기</h1>
          <p className="text-slate-500 mt-1">
            {step === 1 ? '문서 유형을 선택하세요' : '문서 정보를 입력하세요'}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          1
        </div>
        <div className={`flex-1 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          2
        </div>
      </div>

      {/* Step 1: Type Selection */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {DOCUMENT_TYPES.map((type, index) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
                  onClick={() => handleTypeSelect(type.value)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{type.label}</h3>
                        <p className="text-sm text-slate-500">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Step 2: Document Details */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const typeInfo = DOCUMENT_TYPES.find((t) => t.value === selectedType);
                  if (typeInfo) {
                    const Icon = typeInfo.icon;
                    return (
                      <>
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeInfo.color} flex items-center justify-center`}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        {typeInfo.label}
                      </>
                    );
                  }
                  return '문서 정보';
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">문서 제목 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="문서 제목을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">연결 프로젝트 (선택)</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="프로젝트 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">프로젝트 없음</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-slate-400" />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredTemplates.length > 0 && (
                <div className="space-y-2">
                  <Label>템플릿 사용 (선택)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Card
                      className={`cursor-pointer transition-all ${
                        !templateId
                          ? 'ring-2 ring-blue-600 bg-blue-50'
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setTemplateId('')}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">빈 문서로 시작</p>
                          <p className="text-xs text-slate-500">처음부터 작성합니다</p>
                        </div>
                      </CardContent>
                    </Card>
                    {filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all ${
                          templateId === template.id
                            ? 'ring-2 ring-blue-600 bg-blue-50'
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setTemplateId(template.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-sm">{template.title}</p>
                            <p className="text-xs text-slate-500">템플릿 사용</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(1)}>
                  이전
                </Button>
                <Button onClick={handleSubmit} disabled={!title || isSubmitting}>
                  {isSubmitting ? '생성 중...' : '문서 만들기'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
