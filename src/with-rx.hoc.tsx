import React, { ComponentType, useLayoutEffect, useState } from 'react'
import { merge, Observable, Subject } from 'rxjs'
import { map, scan } from 'rxjs/operators'

export type Observify<P extends object> = {
  readonly [K in keyof P]: Observable<P[K]>
}

export type WithRXSelectorResult<P extends object, D extends Partial<P>> = {
  props?: Partial<Observify<P>>
  defaultProps?: D
  effects$?: Observable<unknown>
}

/**
 * curried for better type inference
 * @see https://github.com/Microsoft/TypeScript/issues/15005#issuecomment-430588884
 */
export const withRX = <P extends object>(Target: ComponentType<P>) => <
  D extends Partial<P>
>(
  selector: (props: Observable<Readonly<P>>) => WithRXSelectorResult<P, D>
) => {
  const Hoc = (origin: P) => {
    const subject = new Subject<P>()
    const [state, setState] = useState<Partial<P> | undefined>(undefined)

    useLayoutEffect(() => {
      const { defaultProps, props, effects$ } = selector(subject)
      setState(defaultProps || {})
      if (props) {
        const inputs: Observable<Partial<P>>[] = Object.keys(props).map((key) =>
          // @ts-ignore
          props[key].pipe(map((value) => ({ [key]: value })))
        )
        const result = merge(...inputs)
        const subscription = result
          .pipe(scan((a, b) => Object.assign({}, a, b)))
          .subscribe((values) =>
            setState((prevState) => Object.assign({}, prevState, values))
          )
        const effectsSubscription = effects$ ? effects$.subscribe() : undefined
        return () => {
          subscription.unsubscribe()
          if (effectsSubscription) {
            effectsSubscription.unsubscribe()
          }
        }
      }
      return undefined
    }, [])

    useLayoutEffect(() => {
      subject.next(origin)
    }, Object.values(origin))

    return (
      <React.Fragment>
        {state && React.createElement(Target, Object.assign({}, origin, state))}
      </React.Fragment>
    )
  }

  return Hoc as ComponentType<Partial<P>>
}
