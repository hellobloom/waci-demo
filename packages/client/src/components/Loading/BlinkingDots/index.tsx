import clsx from 'clsx'
import { FC, forwardProps } from 'react-forward-props'

import './index.scss'

export const BlinkingDots: FC<'span'> = (props) => (
  <span {...forwardProps(props)} className={clsx('loading--blinking-dots', props.className)}>
    <span className="loading--blinking-dots__dot">.</span>
    <span className="loading--blinking-dots__dot">.</span>
    <span className="loading--blinking-dots__dot">.</span>
  </span>
)
