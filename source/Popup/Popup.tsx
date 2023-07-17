import * as React from 'react';
import browser from 'webextension-polyfill';

import './styles.scss';

const Popup: React.FC = () => {
  const [speedTime, setSpeedTime] = React.useState('5');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    browser.storage.local.get('speedTime').then(({speedTime}: any) => {
      setSpeedTime(speedTime || '5');
    });
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeedTime(`${Math.min(+e.target.value || 1, 60)}`);
  };

  const onSubmit = () => {
    browser.storage.local
      .set({
        speedTime,
      })
      .then(() => {
        return browser.tabs.query({active: true, currentWindow: true});
        // return window.chrome.runtime.sendMessage({
        //   type: 'video_faster_double_tap_speed',
        //   data: speedTime,
        // });
      })
      .then((tab: any[]) => {
        return browser.tabs.sendMessage(tab[0].id, {
          type: 'video_faster_double_tap_speed',
          data: speedTime,
        });
      })
      .then(() => {
        window.close();
      })
      .catch((e: Error) => {
        setError(e.stack || '');
      });
  };

  return (
    <section id="popup">
      <h2>Video faster</h2>

      <div className="form">
        <span>DoubleTap Speed:</span>
        <input
          className="input"
          type="number"
          placeholder="double tap times for faster"
          min={1}
          max={60}
          value={speedTime}
          onChange={onInputChange}
        />
        <button
          className="primary"
          type="button"
          disabled={!speedTime}
          onClick={onSubmit}
        >
          save
        </button>
      </div>
      {error && (
        <div className="errorContainer">
          <div className="errorTitle">
            <h3>Error:</h3>
            <button
              className="danger"
              type="button"
              onClick={() => setError('')}
            >
              Hide Error
            </button>
          </div>
          <code className="errorCode">{error}</code>
        </div>
      )}
    </section>
  );
};

export default Popup;
