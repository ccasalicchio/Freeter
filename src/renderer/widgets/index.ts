import { WidgetSettings, WidgetType } from '@/widgets/appModules'
import appLauncher from './app-launcher';
import webhookButton from './webhook-button';
import gitStatus from './git-status';
import githubCi from './github-ci';
import githubPrs from './github-prs';
import commander from './commander';
import fileExplorer from './file-explorer';
import fileOpener from './file-opener';
import httpMonitor from './http-monitor';
import linkOpener from './link-opener';
import note from './note';
import timer from './timer';
import toDoList from './to-do-list';
import webpage from './webpage';
import webQuery from './web-query';
import imageMedia from './image-media';
import clipboardHistory from './clipboard-history';
import rssFeedReader from './rss-feed-reader';
import systemMonitor from './system-monitor';
import kanbanBoard from './kanban-board';
import apiRequest from './api-request';
import calendar from './calendar';
import codeSnippet from './code-snippet';
import passwordVault from './password-vault';

const builtinWidgetTypes = [
  appLauncher,
  webhookButton,
  gitStatus,
  githubCi,
  githubPrs,
  commander,
  fileExplorer,
  fileOpener,
  httpMonitor,
  linkOpener,
  note,
  timer,
  toDoList,
  webpage,
  webQuery,
  imageMedia,
  clipboardHistory,
  rssFeedReader,
  systemMonitor,
  kanbanBoard,
  apiRequest,
  calendar,
  codeSnippet,
  passwordVault,
] as unknown as WidgetType<WidgetSettings>[];

const allWidgetTypes = [...builtinWidgetTypes];

export function registerWidgetType(type: WidgetType<WidgetSettings>): void {
  const existingIdx = allWidgetTypes.findIndex(t => t.id === type.id);
  if (existingIdx >= 0) {
    allWidgetTypes[existingIdx] = type;
  } else {
    allWidgetTypes.push(type);
  }
}

export function getAllWidgetTypes(): WidgetType<WidgetSettings>[] {
  return allWidgetTypes;
}

export default allWidgetTypes;
