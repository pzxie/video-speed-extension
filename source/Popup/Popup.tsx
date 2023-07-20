import * as React from 'react';
import browser from 'webextension-polyfill';

import logo from '../assets/icons/favicon-128.png';

import './styles.scss';

const Popup: React.FC = () => {
  const [speedTime, setSpeedTime] = React.useState('5');
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');

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
          ? '<strong>Config saved success. Refresh the page if the config does not work</strong>'
          : '';

        if (successNotice) {
          setNotice(successNotice);
          return;
        }
        if (e.stack) setError(e.stack);
      });
  };

  return (
    <section id="popup">
      <h2 className="header">
        <img src={logo} className="logo" />
        Video Speeder
      </h2>

      <div className="form">
        <span>DoubleTap Seconds:</span>
        <input
          className="input"
          type="number"
          placeholder="double tap seconds"
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
        <div className="messageContainer">
          <div className="messageTitle">
            <h3>Error:</h3>
            <button
              className="danger"
              type="button"
              onClick={() => setError('')}
            >
              Hide Error
            </button>
          </div>
          <div className="messageText">
            <code>{error}</code>
          </div>
        </div>
      )}
      {notice && (
        <div className="messageContainer infoContainer">
          <div className="messageTitle">
            <h3>Note:</h3>
            <button
              className="info"
              type="button"
              onClick={() => setNotice('')}
            >
              Hide
            </button>
          </div>
          <div
            className="messageText"
            dangerouslySetInnerHTML={{__html: notice as string}}
          />
        </div>
      )}
    </section>
  );
};

export default Popup;
