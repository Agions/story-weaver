import {
  Video,
  Plus,
  Edit,
  Trash2,
  Play,
  ImageIcon
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { useTheme } from '@/context/ThemeContext';

import styles from './ProjectGrid.module.less';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'processing' | 'completed';
  thumbnail?: string;
}

interface ProjectGridProps {
  projects: Project[];
  loading: boolean;
  onRefresh?: () => void;
}

/**
 * 项目网格组件
 * 展示项目列表，支持创建、查看、编辑、删除操作
 */

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getStatusConfig = (status: Project['status']) => {
  const config = {
    draft: { color: 'bg-blue-500', text: '草稿' },
    processing: { color: 'bg-orange-500', text: '处理中' },
    completed: { color: 'bg-green-500', text: '已完成' }
  };
  return config[status];
};

const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, loading, onRefresh }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const handleCreateProject = () => {
    navigate('/project/new');
  };

  const handleViewProject = (id: string) => {
    navigate(`/project/${id}`);
  };

  const handleEditProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/project/edit/${id}`);
  };

  const handleOpenEditor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/editor/${id}`);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simplified - just call onRefresh for now
    onRefresh?.();
  };

  return (
    <Card
      className={`${styles.sectionCard} ${isDarkMode ? styles.darkCard : ''}`}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="h-5 w-5" />
          我的项目
        </CardTitle>
        <Button size="sm" onClick={handleCreateProject}>
          <Plus className="h-4 w-4 mr-1" />
          创建新项目
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">暂无项目，点击「创建新项目」开始使用</p>
            <Button onClick={handleCreateProject}>
              <Plus className="h-4 w-4 mr-1" />
              创建新项目
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className={cn(
                  "cursor-pointer hover:shadow-lg transition-shadow",
                  isDarkMode ? styles.darkProjectCard : ""
                )}
                onClick={() => handleViewProject(project.id)}
              >
                {project.thumbnail && (
                  <div className={styles.projectThumbnail}>
                    <img 
                      alt={project.name} 
                      src={project.thumbnail} 
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                  </div>
                )}
                {!project.thumbnail && (
                  <div className="h-32 bg-muted flex items-center justify-center rounded-t-lg">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium truncate">{project.name}</h4>
                    <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                      {getStatusConfig(project.status).text}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {project.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    更新于: {formatDate(project.updatedAt)}
                  </p>
                  <div className="flex justify-end gap-1 mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleEditProject(project.id, e)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleOpenEditor(project.id, e)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleDeleteProject(project.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectGrid;