/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import styles from './appToolbar.module.scss';
import { Button } from '@/ui/components/basic/button';
import { glyphsById } from '@/ui/assets/images/glyphs';

type Deps = {
  openCommandPaletteUseCase: () => void;
  openApplicationSettingsUseCase: () => void;
  openAppManagerUseCase: () => void;
  importProfileUseCase: () => Promise<void>;
  exportProfileUseCase: () => Promise<void>;
}

export function createAppToolbarComponent({
  openCommandPaletteUseCase,
  openApplicationSettingsUseCase,
  openAppManagerUseCase,
  importProfileUseCase,
  exportProfileUseCase,
}: Deps) {
  function AppToolbar() {
    return (
      <div className={styles['app-toolbar']} role='toolbar' aria-label='Quick Actions'>
        <Button iconSvg={glyphsById['tb-search']?.svg} size='S' title='Command Palette' onClick={() => openCommandPaletteUseCase()} />
        <Button iconSvg={glyphsById['tb-app-window']?.svg} size='S' title='Manage Apps' onClick={() => openAppManagerUseCase()} />
        <Button iconSvg={glyphsById['tb-download']?.svg} size='S' title='Import Profile / Freeter 1 Data' onClick={() => importProfileUseCase()} />
        <Button iconSvg={glyphsById['tb-upload']?.svg} size='S' title='Export Profile Backup' onClick={() => exportProfileUseCase()} />
        <Button iconSvg={glyphsById['tb-settings']?.svg} size='S' title='Settings' onClick={() => openApplicationSettingsUseCase()} />
      </div>
    )
  }
  return AppToolbar;
}
