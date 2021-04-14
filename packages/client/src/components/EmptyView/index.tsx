import { ReactNode } from 'react'
import { FC, forwardProps } from 'react-forward-props'
import clsx from 'clsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'

type EmptyViewProps = {
  title: ReactNode
  subTitle?: ReactNode
  icon: IconProp
}

export const EmptyView: FC<'div', EmptyViewProps> = (props) => {
  return (
    <div
      {...forwardProps(props, 'title', 'subTitle', 'glyphClasses')}
      className={clsx('empty-view', 'columns', 'is-centered', 'is-vcentered', props.className)}
    >
      <div className="column has-text-centered">
        <FontAwesomeIcon
          icon={props.icon}
          size="7x"
          className="tw-mb-2"
        />
        <div className="title is-3">{props.title}</div>
        {props.subTitle && <div className="subtitle">{props.subTitle}</div>}
        {props.children}
      </div>
    </div>
  )
}
