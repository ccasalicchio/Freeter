/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

export interface SvgIconProps extends Pick<React.SVGProps<SVGSVGElement>, 'className' | 'style'> {
  svg: string;
}

export const SvgIcon = (props: SvgIconProps) => {
  const {svg, ...rest} = props;

  // the svg-sprite plugin exports bare symbol ids; <use> needs a fragment ref
  const href = svg.startsWith('#') ? svg : `#${svg}`;
  return (
    <svg {...rest}>
      <use href={href}></use>
    </svg>
  )
}
