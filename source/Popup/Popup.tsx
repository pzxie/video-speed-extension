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
    const {value} = e.target;

    if (
      +value > 60 ||
      value.indexOf('-') > -1 ||
      value.indexOf('.') > -1 ||
      value === '0'
    ) {
      return;
    }

    setSpeedTime(value);
  };

  const onSubmit = () => {
    let saveSuccess = false;

    browser.storage.local
      .set({
        speedTime,
      })
      .then(() => {
        saveSuccess = true;
        return browser.tabs.query({active: true, currentWindow: true});
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
        const successNotice = saveSuccess
          ? '<div><strong>Config saved success. Errors elsewhere:</strong></div>'
          : '';
        setError(successNotice + e.stack || '');
      });
  };

  return (
    <section id="popup">
      <h2>Video Speeder</h2>

      <div className="form">
        <span>DoubleTap Speed:</span>
        <input
          className="input"
          type="number"
          placeholder="double tap times for faster"
          min={1}
          max={60}
          value={speedTime}
          onInput={onInputChange}
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
          <code
            className="errorCode"
            dangerouslySetInnerHTML={{__html: error as string}}
          />
        </div>
      )}
    </section>
  );
};

export default Popup;
