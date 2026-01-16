'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Edit,
  FileText,
  User,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@countin/ui';
import { formatCurrency, formatDate } from '@countin/utils';
import { ProjectModal } from '../components/project-modal';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  description: string;
  memo?: string;
  account: Account;
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
  transactions: Transaction[];
  _count: {
    transactions: number;
  };
}

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.data);
      } else {
        setError(data.error?.message || '프로젝트를 불러올 수 없습니다');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleEditSuccess = () => {
    setIsModalOpen(false);
    fetchProject();
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EXPENSE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'INCOME':
        return '수입';
      case 'EXPENSE':
        return '지출';
      default:
        return '이체';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-rose-500';
    if (progress >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">{error || '프로젝트를 찾을 수 없습니다'}</p>
        <Button onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/projects')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <Badge variant="outline" className={getStatusColor(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
            </div>
            {project.code && (
              <p className="text-sm text-slate-500 font-mono mt-1">{project.code}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Edit className="w-4 h-4 mr-2" />
          수정
        </Button>
      </div>

      {/* Project Info */}
      {(project.description || project.startDate || project.endDate || project.manager) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {project.description && (
                  <p className="text-slate-600 flex-1">{project.description}</p>
                )}
                {(project.startDate || project.endDate) && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 shrink-0">
                    <Calendar className="w-4 h-4" />
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
              </div>

              {/* Manager & Members */}
              {(project.manager || (project.members && project.members.length > 0)) && (
                <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
                  {/* Manager */}
                  {project.manager && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {project.manager.avatar ? (
                          <img
                            src={project.manager.avatar}
                            alt={project.manager.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-400">주 담당자:</span>{' '}
                        <span className="font-medium text-slate-700">
                          {project.manager.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Members */}
                  {project.members && project.members.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 3).map((member) => (
                          <div
                            key={member.userId}
                            className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center overflow-hidden"
                            title={member.user?.name || ''}
                          >
                            {member.user?.avatar ? (
                              <img
                                src={member.user.avatar}
                                alt={member.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                        ))}
                        {project.members.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                            +{project.members.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-slate-500">
                        부 담당자 {project.members.length}명
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">예산</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(project.budgetAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">수입</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(project.incomeAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">지출</p>
                  <p className="text-xl font-bold text-rose-600">
                    {formatCurrency(project.expenseAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  project.remainingAmount < 0 ? 'bg-rose-50' : 'bg-blue-50'
                }`}>
                  <FileText className={`w-5 h-5 ${
                    project.remainingAmount < 0 ? 'text-rose-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">잔액</p>
                  <p className={`text-xl font-bold ${
                    project.remainingAmount < 0 ? 'text-rose-600' : 'text-blue-600'
                  }`}>
                    {formatCurrency(project.remainingAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>예산 집행률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-bold text-slate-900">
                    {project.progress}%
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatCurrency(project.spentAmount)} / {formatCurrency(project.budgetAmount)}
                  </p>
                </div>
                {project.progress >= 100 && (
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                    예산 초과
                  </Badge>
                )}
                {project.progress >= 80 && project.progress < 100 && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    예산 주의
                  </Badge>
                )}
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, project.progress)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getProgressColor(project.progress)}`}
                />
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>거래 내역</CardTitle>
              <span className="text-sm text-slate-500">
                총 {project._count.transactions}건
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {project.transactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">이 프로젝트에 등록된 거래가 없습니다</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>적요</TableHead>
                      <TableHead>계정과목</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.transactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => router.push('/dashboard/transactions')}
                      >
                        <TableCell className="font-medium text-slate-600">
                          {formatDate(new Date(transaction.date))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getTypeColor(transaction.type)}
                            >
                              {getTypeLabel(transaction.type)}
                            </Badge>
                            <span className="text-slate-900">
                              {transaction.description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {transaction.account.name}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            transaction.type === 'INCOME'
                              ? 'text-emerald-600'
                              : transaction.type === 'EXPENSE'
                                ? 'text-rose-600'
                                : 'text-blue-600'
                          }`}
                        >
                          {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Modal */}
      <ProjectModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleEditSuccess}
        project={project}
      />
    </div>
  );
}
