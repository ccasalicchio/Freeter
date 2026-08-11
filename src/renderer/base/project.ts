/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Entity, EntityId } from '@/base/entity';
import { EntityIdList } from '@/base/entityList';
import { MemSaverConfigPrj } from '@/base/memSaver';
import { generateUniqueName } from '@/base/utils';

export interface ProjectIcon {
  readonly glyph: string;
  readonly color: string;
  /** custom image URL or local path; wins over glyph when set */
  readonly image: string;
}

export interface ProjectSettings {
  readonly memSaver: MemSaverConfigPrj;
  readonly name: string;
  /** optional root folder for the project (v1 heritage; used as a base for project-relative paths) */
  readonly rootFolder?: string;
  /** optional project logo/icon */
  readonly icon?: ProjectIcon;
}
export interface Project extends Entity {
  readonly settings: ProjectSettings;
  readonly workflowIds: EntityIdList;
  readonly currentWorkflowId: EntityId;
}

export function createProject(id: EntityId, projectName: string): Project {
  return {
    id,
    settings: {
      memSaver: {},
      name: projectName,
    },
    workflowIds: [],
    currentWorkflowId: ''
  };
}

export function generateProjectName(usedNames: string[]): string {
  return generateUniqueName('Project', usedNames);
}

export function updateProjectSettings(project: Project, settings: ProjectSettings): Project {
  return {
    ...project,
    settings
  }
}

export function updateProjectWorkflows(project: Project, workflowIds: EntityIdList): Project {
  return {
    ...project,
    workflowIds
  }
}
