import { WidgetApi } from '@/widgets/appModules';

export async function openInViewer(imagePath: string, widgetApi: WidgetApi) {
  if (imagePath) {
    await widgetApi.shell.openPath(imagePath);
  }
}
