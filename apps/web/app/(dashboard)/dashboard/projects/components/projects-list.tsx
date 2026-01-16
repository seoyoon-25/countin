'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Calendar,
  TrendingUp,
  Wallet,
  FolderOpen,
  User,
  Filter,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@countin/ui';
import { formatCurrency, formatDate } from '@countin/utils';
import { useDebounce } from '@countin/hooks';
import { ProjectModal } from './project-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface Project {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  budgetAmount: number;
  incomeAmount: number;
  expenseAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progress: number;
  managerId?: string | null;
  manager?: Member | null;
  members?: { userId: string; role: string; user?: Member }[];
  _count: {
    transactions: number;
  };
}

const PROJECT_STATUSES = [
  { value: 'all', label: '전체' },
  { value: 'PLANNING', label: '계획중' },
  { value: 'ACTIVE', label: '진행중' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

export function ProjectsList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [myOnly, setMyOnly] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Delete states
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ includeAll: 'true' });
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (myOnly) {
        params.append('myOnly', 'true');
      }

      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();

      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, myOnly]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter projects by search
  const filteredProjects = projects.filter((project) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      (project.code && project.code.toLowerCase().includes(searchLower)) ||
      (project.description && project.description.toLowerCase().includes(searchLower))
    );
  });

  const handleOpenModal = (project?: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProject(project || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchProjects();
  };

  const handleDeleteClick = (project: Project) => {
    setDeleteProject(project);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProject) return;

    try {
      const response = await fetch(`/api/projects/${deleteProject.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        fetchProjects();
      } else {
        alert(data.error?.message || '삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setDeleteProject(null);
    }
  };

  const handleCardClick = (project: Project) => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return '계획중';
      case 'ACTIVE':
        return '진행중';
      case 'COMPLETED':
        return '완료';
      case 'CANCELLED':
        return '취소';
      default:
        return status;
    }
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'CANCELLED') return 'bg-slate-300';
    if (progress >= 100) return 'bg-rose-500';
    if (progress >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>프로젝트 목록</CardTitle>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              프로젝트 추가
            </Button>
          </div>

          {/* Status Filter Tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mt-4">
            <TabsList className="grid w-full grid-cols-5">
              {PROJECT_STATUSES.map((status) => (
                <TabsTrigger key={status.value} value={status.value}>
                  {status.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Search and Filter */}
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="프로젝트명, 코드, 설명으로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={myOnly ? 'default' : 'outline'}
              onClick={() => setMyOnly(!myOnly)}
              className="shrink-0"
            >
              <User className="w-4 h-4 mr-2" />
              내 프로젝트만
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-slate-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              </motion.div>
              <p className="text-slate-500 mb-4">
                {debouncedSearch
                  ? '검색 결과가 없습니다'
                  : '아직 등록된 프로젝트가 없습니다'}
              </p>
              {!debouncedSearch && (
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="w-4 h-4 mr-2" />첫 프로젝트 추가하기
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-lg hover:border-slate-300 transition-all"
                    onClick={() => handleCardClick(project)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {project.name}
                        </h3>
                        {project.code && (
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {project.code}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`ml-2 shrink-0 ${getStatusColor(project.status)}`}
                      >
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}

                    {/* Manager */}
                    {project.manager && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {project.manager.avatar ? (
                            <img
                              src={project.manager.avatar}
                              alt={project.manager.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                        <span className="text-sm text-slate-600 truncate">
                          {project.manager.name}
                        </span>
                        {project.members && project.members.length > 0 && (
                          <span className="text-xs text-slate-400">
                            +{project.members.length}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date Range */}
                    {(project.startDate || project.endDate) && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {project.startDate
                            ? formatDate(new Date(project.startDate))
                            : '미정'}
                          {' ~ '}
                          {project.endDate
                            ? formatDate(new Date(project.endDate))
                            : '미정'}
                        </span>
                      </div>
                    )}

                    {/* Budget & Spending */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" />
                          예산
                        </span>
                        <span className="font-medium text-slate-700">
                          {formatCurrency(project.budgetAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          집행액
                        </span>
                        <span className={`font-medium ${
                          project.progress >= 100 ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {formatCurrency(project.spentAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">집행률</span>
                        <span className={`font-medium ${
                          project.progress >= 100
                            ? 'text-rose-600'
                            : project.progress >= 80
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                        }`}>
                          {project.progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, project.progress)}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${getProgressColor(project.progress, project.status)}`}
                        />
                      </div>
                    </div>

                    {/* Transaction Count */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400">
                        거래 {project._count.transactions}건
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Modal */}
      <ProjectModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSaveSuccess}
        project={editingProject}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteProject}
        onClose={() => setDeleteProject(null)}
        onConfirm={handleDeleteConfirm}
        project={deleteProject}
      />
    </>
  );
}
