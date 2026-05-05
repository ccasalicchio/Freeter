import { Registry } from '@/application/interfaces/registry';
import { getAllWidgetTypes } from '@/widgets';

export const registry: Registry = {
  getWidgetTypes: () => getAllWidgetTypes()
}
