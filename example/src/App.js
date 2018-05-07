import React, { Component, Fragment } from 'react';
import uuid from 'uuid';
import PropTypes from 'prop-types';
import { HotKeys as ReactHotkeys } from 'react-hotkeys';
import Modal from 'react-responsive-modal';

const { Provider, Consumer } = React.createContext('hotkeys-display');

export default class App extends Component {
  state = {
    showHelp: false,
  };

  render() {
    return (
      <HotkeysProvider>
        <FinalHotkeys
          keyMap={[
            { shortcut: 'ctrl+up', callback: () => console.log('moving up') },
            {
              shortcut: 'ctrl+down',
              callback: () => console.log('moving down'),
            },
            {
              shortcut: 'h',
              callback: () => this.setState({ showHelp: true }),
            },
          ]}
        />
        <FinalHotkeys
          keyMap={[
            { shortcut: 'a', callback: () => console.log('pressing a') },
          ]}
        >
          <p>Testing hotkeys!</p>
        </FinalHotkeys>
        {this.state.showHelp && (
          <FinalHotkeysModal
            onClose={() => this.setState({ showHelp: false })}
          />
        )}
      </HotkeysProvider>
    );
  }
}

const withHotkeysConsumer = WrappedComponent => {
  const withHotkeys = props => (
    <Consumer>
      {context => <WrappedComponent {...context} {...props} />}
    </Consumer>
  );

  withHotkeys.displayName = `withMouse(${WrappedComponent.displayName ||
    WrappedComponent.name})`;
  return withHotkeys;
};

class HotkeyModal extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
  };

  render() {
    return (
      <Modal open onClose={this.props.onClose} center>
        <Consumer>
          {({ hotkeys }) => {
            return (
              <Fragment>
                <h1>Shortcuts!</h1>
                <ul>{hotkeys.map(hotkey => <li>{hotkey.shortcut}</li>)}</ul>
              </Fragment>
            );
          }}
        </Consumer>
      </Modal>
    );
  }
}

const FinalHotkeysModal = withHotkeysConsumer(HotkeyModal);

// HotkeysProvider

class HotkeysProvider extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  state = {
    hotkeys: [],
  };

  addHotkeys = hotkeys => {
    const hotkeysWithId = hotkeys.map(hotkey => ({
      ...hotkey,
      id: uuid.v4(),
    }));
    this.setState(state => ({ hotkeys: state.hotkeys.concat(hotkeysWithId) }));
  };

  removeHotkeys = hotkeys => {
    const hotkeysFiltered = this.state.hotkeys.filter(
      hotkey => !hotkeys.some(({ id }) => id === hotkey.id),
    );
    this.setState({ hotkeys: hotkeysFiltered });
  };

  render() {
    const { children } = this.props;
    const { hotkeys } = this.state;
    const value = {
      addHotkeys: this.addHotkeys,
      removeHotkeys: this.removeHotkeys,
      hotkeys,
    };
    return <Provider value={value}>{children}</Provider>;
  }
}

// util
const mapKeyMapToReactHotkeysMap = keyMap =>
  keyMap.reduce((acc, curr) => {
    return {
      ...acc,
      [curr.shortcut]: curr.callback,
    };
  }, {});

// hotkeys
class Hotkeys extends Component {
  static propTypes = {
    addHotkeys: PropTypes.func.isRequired,
    removeHotkeys: PropTypes.func.isRequired,
    keyMap: PropTypes.arrayOf(
      PropTypes.shape({
        shortcut: PropTypes.string,
        callback: PropTypes.func,
        meta: PropTypes.object,
      }),
    ),
    children: PropTypes.node,
  };

  static defaultProps = {
    keyMap: [],
  };

  componentWillMount() {
    this.props.addHotkeys(this.props.keyMap);
  }

  componentWillUnmount() {
    this.props.removeHotkeys(this.props.keyMap);
  }

  render() {
    const { keyMap, children } = this.props;
    const handlers = mapKeyMapToReactHotkeysMap(keyMap);
    if (children)
      return <ReactHotkeys handlers={handlers}>{children}</ReactHotkeys>;

    return <ReactHotkeys handlers={handlers} focused attach={window} />;
  }
}

const FinalHotkeys = withHotkeysConsumer(Hotkeys);
