import React, {useEffect, useState, useRef} from 'react';
import './MessengerApp.css';

/*
    Main React UI Componenet that encapsulates one user's interactions with others
*/
const MessengerApp = (props) => {

    // Used to build the select dropdown for choosing the recipient
    const [availableUsers, setAvailableUsers] = useState(['']);
    // Messages in the chat
    const [messages, setMessages] = useState([]);
    // Freshly composed message before it is sent
    const [newMessage, setNewMessage] = useState('');
    // Used, in part, to disable the 'Send' button until someone is logged in
    const [loggedIn, setLoggedIn] = useState(false);
    // Captures the name of the currently logged in person
    const [sender, setSender] = useState('');
    // Selected receiver in the dropdown
    const [selectedReceiver, setSelectedReceiver] = useState('');
    // Used to filter out the currently logged in person from the list of available
    // users because the sender should not be selectable in the list of available users
    const senderRef = useRef(sender);
    // Enable the sending of messages when user logged in and a recipient is selected
    const [sendMessageEnabled, setSendMessageEnabled] = useState(false);
    // Reference to the div containing the messages so we can automatically scroll
    // to the bottom as needed.
    const messageList = useRef(null);
    // Ref to the input field where the user enters his/her name before logging in
    let usernameRef = React.createRef();

    // Needed to keep a fresh ref to the current sender - for when the backend
    // asynchronously calls a method, which falls outside the react lifecycle
    useEffect(() => {
        senderRef.current = sender;
    }, [sender]);

    // Available users can dynamically and asynchronously change based on the backend.
    // This keeps the current selection from being removed when the options in the
    // select dropdown are changed
    useEffect(() => {
        if (selectedReceiver) {
            setSelectedReceiver(selectedReceiver);
        }
    }, [availableUsers]);

    // Retrieve message history for the newly selected receiver
    useEffect(() => {
        if (selectedReceiver) {
            const messages = props.backend.getMessagesFor(sender, selectedReceiver);
            onMessagesChanged(messages);
        } else {
            props.backend.clearOutRecipientFor(sender);
        }
    }, [selectedReceiver])

    // Scroll the message list automatically so that fresh messages are not hidden
    useEffect(() => {
        (messageList.current)
                &&
        (messageList.current.scrollTo({ top: messageList.current.scrollHeight, behavior: 'smooth' }));
    }, [messages])

    // user friendly formatting of time of a particular message
    const formattedTime = (time) => {
        const dt = new Date(time);
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayOfWeek = daysOfWeek[dt.getDay()];
        let hours = dt.getHours();
        const meridiem = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        const seconds = String(dt.getSeconds()).padStart(2, '0');
        return `${dayOfWeek} ${hours}:${minutes}:${seconds} ${meridiem}`;
    }

    const setReceiver = (receiver) => {
        let recipient = receiver === '' ? undefined : receiver;
        setSelectedReceiver(recipient);
        const sendingEnabled = (receiver && recipient);
        setSendMessageEnabled(sendingEnabled);
    }

    const onMessagesChanged = (messages) => {
        if (senderRef.current) {
            const messageItems = [];
            messages.forEach(m => {
                messageItems.push({key: `${m.time}-time`, sender: 'system', text: formattedTime(m.time)});
                messageItems.push({key: m.time, sender: m.sender, text: m.msg});
            })
            setMessages(messageItems);
        }
    }

    const onUsersChanged = (users) => {
        const sortedUsers =  (users.filter(u => u != senderRef.current) ).sort();
        setAvailableUsers( ['', ...sortedUsers] );
    }

    const sendMessage = (kb) => {
        if (newMessage.trim()) {
            props.backend.sendMessage({ message: newMessage, sender: sender, receiver: selectedReceiver }).then(() => {
                setNewMessage('');
            })
        }
    }

    const messageKeyPress = (kb) => {
        (kb.key === 'Enter') && sendMessage();
    }

    const closePanel = () => {
        props.onPanelClose(props.panelKey);
    }

    const login = () => {
        const sender = usernameRef.current.value;
        setSender(sender);
        props.backend.loginOrRegisterUser(sender, {
            users: onUsersChanged,
            messages: onMessagesChanged
        }).then(() => {
            setLoggedIn(true);
        })
    }

    return (
        <div className="cog-chat-container">
            <div>
                <span className='cog-close-panel' onClick={closePanel}>&#x2716;</span>
            </div>
            <div className="cog-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center' }}>
                    <label  style={{fontSize: 'large'}}>Contact: </label>
                    <select style={{fontSize: 'large'}}
                        value={selectedReceiver}
                        onChange={(e) => {
                            setReceiver(e.target.value);
                        }}>
                        {availableUsers.map( user => (
                            <option key={user} value={user}>
                                {user}
                            </option>
                        ))}
                    </select>
                    <span className="circle blue"></span>
                </div>
                <div style={{display: 'flex', gap: '10px', flexShring: 0}}>
                    <span className="circle red" style={{marginTop: '12px'}}></span>
                    <input ref={usernameRef} />
                    <button className="cog-button" onClick={login} style={{flex: '0 0 auto'}}>Create/Login</button>
                </div>
            </div>

            <div className="cog-messages" ref={messageList}
                style={{
                  height: '150px',
                  overflowY: 'auto',
                }}
            >
                {messages.map((msg) => (
                    <div    key={msg.key}
                            className={ `${  msg.sender === 'system' ? 'cog-system-time' :
                                        (msg.sender === sender ? 'cog-sent-message' : 'cog-received-message') }` }
                    >
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className={`${!sendMessageEnabled ? 'cog-disabled' : ''}`}>
                <div className="cog-input-area">
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={messageKeyPress}
                        placeholder="hello..."
                    />
                    <button className='cog-button' onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    )
}
export default MessengerApp;
