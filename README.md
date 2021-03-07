# react-with-rx

> HOC (High Ordered Component) to allow pass observable as property to component without manually management subscriptions.

[![NPM](https://img.shields.io/npm/v/react-with-rx.svg)](https://www.npmjs.com/package/react-with-rx) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-with-rx
```

## Usage

```tsx
import React from "react";
import { withRX } from "react-with-rx/dist/index";
import { of, Subject, timer } from "rxjs";
import { switchMap } from "rxjs/operators";

type TimerProps = {
  tick: number;
  onToggle: (started: boolean) => void;
  started: boolean;
}

const TimerComponent = ({ tick, onToggle, started }: TimerProps) => {
  return <div style={{ textAlign: "center" }}>
    <h2>Timer: {tick}</h2>
    <button disabled={started} onClick={() => onToggle(true)}>Start</button>
    <button disabled={!started} onClick={() => onToggle(false)}>Stop</button>
  </div>;
};

const timerRequest$ = new Subject<boolean>();

const TimerContainer = withRX(TimerComponent)(() => {

  return {
    defaultProps: {
      tick: 0,
      started: false,
      onToggle: (started: boolean) => {
        timerRequest$.next(started);
      }
    },
    props: {
      tick: timerRequest$.pipe(
        switchMap((request) => request ? timer(0, 1000) : of(0))
      ),
      started: timerRequest$
    }
  };
});

const App = () => {
  return <TimerContainer />;
};

export default App;

```

## License

MIT © [pelenthium](https://github.com/pelenthium)
