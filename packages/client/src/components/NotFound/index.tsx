import clsx from 'clsx'
import { FC, forwardProps } from 'react-forward-props'
import { Link } from 'react-router-dom'

import { Button } from 'components/Button'

type NotFoundProps = {
  action?: { text: string; link: string }
}

const NotFound: FC<'div', NotFoundProps> = (props) => (
  <div {...forwardProps(props, 'action')} className={clsx('container', props.className)}>
    <div className={clsx('not-found', 'columns', 'is-centered', 'px-6', 'py-6')}>
      <div className="column is-half has-text-centered">
        <div className="title is-3">404</div>
        {props.children && <div className="subtitle">{props.children}</div>}
        {props.action && (
          <Button as={Link} {...{ to: props.action.link }}>
            {props.action.text}
          </Button>
        )}
      </div>
    </div>
  </div>
)

export { NotFound }
