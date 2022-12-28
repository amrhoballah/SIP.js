import { SimpleUser, SimpleUserDelegate, SimpleUserOptions } from "sip.js/lib/platform/web";
import { nameAlice, nameBob, uriAlice, uriBob, webSocketServerAlice } from "./test-users.js";
import { getButton, getInput, getVideo } from "./test-utils.js";

const connectAlice = getButton("connectAlice");
const disconnectAlice = getButton("disconnectAlice");
const registerAlice = getButton("registerAlice");
const unregisterAlice = getButton("unregisterAlice");
const beginAlice = getButton("beginAlice");
const endAlice = getButton("endAlice");
const holdAlice = getInput("holdAlice");
const muteAlice = getInput("muteAlice");
const videoLocalAlice = getVideo("videoLocalAlice");
const videoRemoteAlice = getVideo("videoRemoteAlice");

// New SimpleUser for Alice
const alice = buildUser(
  webSocketServerAlice,
  uriAlice,
  nameAlice,
  uriBob,
  nameBob,
  connectAlice,
  disconnectAlice,
  registerAlice,
  unregisterAlice,
  beginAlice,
  endAlice,
  holdAlice,
  muteAlice,
  videoLocalAlice,
  videoRemoteAlice
);

function buildUser(
  webSocketServer: string,
  aor: string,
  displayName: string,
  targetAOR: string,
  targetName: string,
  connectButton: HTMLButtonElement,
  disconnectButton: HTMLButtonElement,
  registerButton: HTMLButtonElement,
  unregisterButton: HTMLButtonElement,
  beginButton: HTMLButtonElement,
  endButton: HTMLButtonElement,
  holdCheckbox: HTMLInputElement,
  muteCheckbox: HTMLInputElement,
  videoLocalElement: HTMLVideoElement,
  videoRemoteElement: HTMLVideoElement
): SimpleUser {
  // SimpleUser options
  const options: SimpleUserOptions = {
    aor,
    media: {
      constraints: {
        audio: true,
        video: true
      },
      local: {
        video: videoLocalElement
      },
      remote: {
        video: videoRemoteElement
      }
    },
    userAgentOptions: {
      displayName
    }
  };

  // Create SimpleUser
  const user = new SimpleUser(webSocketServer, options);

  // SimpleUser delegate
  const delegate: SimpleUserDelegate = {
    onCallAnswered: makeCallAnsweredCallback(user, holdCheckbox, muteCheckbox),
    onCallCreated: makeCallCreatedCallback(user, beginButton, endButton, holdCheckbox, muteCheckbox),
    onCallReceived: makeCallReceivedCallback(user),
    onCallHangup: makeCallHangupCallback(user, beginButton, endButton, holdCheckbox, muteCheckbox),
    onCallHold: makeCallHoldCallback(user, holdCheckbox),
    onRegistered: makeRegisteredCallback(user, registerButton, unregisterButton),
    onUnregistered: makeUnregisteredCallback(user, registerButton, unregisterButton),
    onServerConnect: makeServerConnectCallback(user, connectButton, disconnectButton, registerButton, beginButton),
    onServerDisconnect: makeServerDisconnectCallback(user, connectButton, disconnectButton, registerButton, beginButton)
  };
  user.delegate = delegate;

  // Setup connect button click listeners
  connectButton.addEventListener(
    "click",
    makeConnectButtonClickListener(user, connectButton, disconnectButton, registerButton, beginButton)
  );

  // Setup disconnect button click listeners
  disconnectButton.addEventListener(
    "click",
    makeDisconnectButtonClickListener(user, connectButton, disconnectButton, registerButton, beginButton)
  );

  // Setup register button click listeners
  registerButton.addEventListener("click", makeRegisterButtonClickListener(user, registerButton));

  // Setup unregister button click listeners
  unregisterButton.addEventListener("click", makeUnregisterButtonClickListener(user, unregisterButton));

  // Setup begin button click listeners
  beginButton.addEventListener("click", makeBeginButtonClickListener(user, targetAOR, targetName));

  // Setup end button click listeners
  endButton.addEventListener("click", makeEndButtonClickListener(user));

  // Setup hold change listeners
  holdCheckbox.addEventListener("change", makeHoldCheckboxClickListener(user, holdCheckbox));

  // Setup mute change listeners
  muteCheckbox.addEventListener("change", makeMuteCheckboxClickListener(user, muteCheckbox));

  // Enable connect button
  connectButton.disabled = false;

  return user;
}

// Helper function to create call anaswered callback
function makeCallAnsweredCallback(
  user: SimpleUser,
  holdCheckbox: HTMLInputElement,
  muteCheckbox: HTMLInputElement
): () => void {
  return () => {
    holdCheckboxDisabled(false, holdCheckbox);
    muteCheckboxDisabled(false, muteCheckbox);
  };
}

// Helper function to create call received callback
function makeCallReceivedCallback(user: SimpleUser): () => void {
  return () => {
    user.answer().catch((error: Error) => {
      alert(`[${user.id}] Failed to answer call.\n` + error);
    });
  };
}

// Helper function to create call created callback
function makeCallCreatedCallback(
  user: SimpleUser,
  beginButton: HTMLButtonElement,
  endButton: HTMLButtonElement,
  holdCheckbox: HTMLInputElement,
  muteCheckbox: HTMLInputElement
): () => void {
  return () => {
    beginButton.disabled = true;
    endButton.disabled = false;
    holdCheckboxDisabled(true, holdCheckbox);
    muteCheckboxDisabled(true, muteCheckbox);
  };
}

// Helper function to create call hangup callback
function makeCallHangupCallback(
  user: SimpleUser,
  beginButton: HTMLButtonElement,
  endButton: HTMLButtonElement,
  holdCheckbox: HTMLInputElement,
  muteCheckbox: HTMLInputElement
): () => void {
  return () => {
    beginButton.disabled = !user.isConnected();
    endButton.disabled = true;
    holdCheckboxDisabled(true, holdCheckbox);
    muteCheckboxDisabled(true, muteCheckbox);
  };
}

// Helper function to create call answered callback
function makeCallHoldCallback(user: SimpleUser, holdCheckbox: HTMLInputElement): (held: boolean) => void {
  return (held: boolean) => {
    holdCheckbox.checked = held;
  };
}

// Helper function to create registered callback
function makeRegisteredCallback(
  user: SimpleUser,
  registerButton: HTMLButtonElement,
  unregisterButton: HTMLButtonElement
): () => void {
  return () => {
    registerButton.disabled = true;
    unregisterButton.disabled = false;
  };
}

// Helper function to create unregistered callback
function makeUnregisteredCallback(
  user: SimpleUser,
  registerButton: HTMLButtonElement,
  unregisterButton: HTMLButtonElement
): () => void {
  return () => {
    registerButton.disabled = !user.isConnected();
    unregisterButton.disabled = true;
  };
}

// Helper function to create network connect callback
function makeServerConnectCallback(
  user: SimpleUser,
  connectButton: HTMLButtonElement,
  disconnectButton: HTMLButtonElement,
  registerButton: HTMLButtonElement,
  beginButton: HTMLButtonElement
): () => void {
  return () => {
    connectButton.disabled = true;
    disconnectButton.disabled = false;
    registerButton.disabled = false;
    beginButton.disabled = false;
  };
}

// Helper function to create network disconnect callback
function makeServerDisconnectCallback(
  user: SimpleUser,
  connectButton: HTMLButtonElement,
  disconnectButton: HTMLButtonElement,
  registerButton: HTMLButtonElement,
  beginButton: HTMLButtonElement
): () => void {
  return (error?: Error) => {
    connectButton.disabled = false;
    disconnectButton.disabled = true;
    registerButton.disabled = true;
    beginButton.disabled = true;
    if (error) {
      alert(`[${user.id}] Server disconnected.\n` + error.message);
    }
  };
}

// Helper function to setup click handler for connect button
function makeConnectButtonClickListener(
  user: SimpleUser,
  connectButton: HTMLButtonElement,
  disconnectButton: HTMLButtonElement,
  registerButton: HTMLButtonElement,
  beginButton: HTMLButtonElement
): () => void {
  return () => {
    user
      .connect()
      .then(() => {
        connectButton.disabled = true;
        disconnectButton.disabled = false;
        registerButton.disabled = false;
        beginButton.disabled = false;
      })
      .catch((error: Error) => {
        alert(`[${user.id}] Failed to connect.\n` + error);
      });
  };
}

// Helper function to setup click handler for disconnect button
function makeDisconnectButtonClickListener(
  user: SimpleUser,
  connectButton: HTMLButtonElement,
  disconnectButton: HTMLButtonElement,
  registerButton: HTMLButtonElement,
  beginButton: HTMLButtonElement
): () => void {
  return () => {
    user
      .disconnect()
      .then(() => {
        connectButton.disabled = false;
        disconnectButton.disabled = true;
        registerButton.disabled = true;
        beginButton.disabled = true;
      })
      .catch((error: Error) => {
        alert(`[${user.id}] Failed to disconnect.\n` + error);
      });
  };
}

// Helper function to setup click handler for register button
function makeRegisterButtonClickListener(user: SimpleUser, registerButton: HTMLButtonElement): () => void {
  return () => {
    user
      .register({
        // An example of how to get access to a SIP response message for custom handling
        requestDelegate: {
          onReject: (response) => {
            let message = `Registration of "${user.id}" rejected.\n`;
            message += `Reason: ${response.message.reasonPhrase}\n`;
            alert(message);
          }
        }
      })
      .then(() => {
        registerButton.disabled = true;
      })
      .catch((error: Error) => {
        alert(`[${user.id}] Failed to register.\n` + error);
      });
  };
}

// Helper function to setup click handler for unregister button
function makeUnregisterButtonClickListener(user: SimpleUser, unregisterButton: HTMLButtonElement): () => void {
  return () => {
    user
      .unregister()
      .then(() => {
        unregisterButton.disabled = true;
      })
      .catch((error: Error) => {
        alert(`[${user.id}] Failed to unregister.\n` + error);
      });
  };
}

// Helper function to setup click handler for begin button
function makeBeginButtonClickListener(user: SimpleUser, target: string, targetDisplay: string): () => void {
  return () => {
    user
      .call(target, undefined, {
        // An example of how to get access to a SIP response message for custom handling
        requestDelegate: {
          onReject: (response) => {
            let message = `Session invitation to "${targetDisplay}" rejected.\n`;
            message += `Reason: ${response.message.reasonPhrase}\n`;
            message += `Perhaps "${targetDisplay}" is not connected or registered?\n`;
            message += `Or perhaps "${targetDisplay}" did not grant access to video?\n`;
            alert(message);
          }
        },
        withoutSdp: false
      })
      .catch((error: Error) => {
        alert(`[${user.id}] Failed to begin session.\n` + error);
      });
  };
}

// Helper function to setup click handler for begin button
function makeEndButtonClickListener(user: SimpleUser): () => void {
  return () => {
    user.hangup().catch((error: Error) => {
      alert(`[${user.id}] Failed to end session.\n` + error);
    });
  };
}

// Helper function to setup click handler for hold checkbox
function makeHoldCheckboxClickListener(user: SimpleUser, holdCheckbox: HTMLInputElement): () => void {
  return () => {
    if (holdCheckbox.checked) {
      // Checkbox is checked..
      user.hold().catch((error: Error) => {
        holdCheckbox.checked = false;
        alert("Failed to hold call.\n" + error);
      });
    } else {
      // Checkbox is not checked..
      user.unhold().catch((error: Error) => {
        holdCheckbox.checked = true;
        alert("Failed to unhold call.\n" + error);
      });
    }
  };
}

// Hold helper function
const holdCheckboxDisabled = (disabled: boolean, holdCheckbox: HTMLInputElement): void => {
  holdCheckbox.checked = false;
  holdCheckbox.disabled = disabled;
};

// Helper function to setup click handler for mute checkbox
function makeMuteCheckboxClickListener(user: SimpleUser, muteCheckbox: HTMLInputElement): () => void {
  return () => {
    if (muteCheckbox.checked) {
      // Checkbox is checked..
      user.mute();
      if (user.isMuted() === false) {
        muteCheckbox.checked = false;
        alert("Failed to mute call.\n");
      }
    } else {
      // Checkbox is not checked..
      user.unmute();
      if (user.isMuted() === true) {
        muteCheckbox.checked = true;
        alert("Failed to unmute call.\n");
      }
    }
  };
}

// Mute helper function
const muteCheckboxDisabled = (disabled: boolean, muteCheckbox: HTMLInputElement): void => {
  muteCheckbox.checked = false;
  muteCheckbox.disabled = disabled;
};
