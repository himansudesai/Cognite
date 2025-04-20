import React, {useEffect, useState} from 'react';
import MessengerApp from '../MessengerApp/MessengerApp';
import backend from '../../backend/FakeBackend';
import './DemoContainer.css';

/*
    A UI level container, for demostration purposes, that holds one or more Messenger
    Apps.  Allows multiple Messanger Apps to be easily demostrated.
*/
const DemoContainer = () => {

    const [users, setUsers] = useState([]);

    const addNewMessengerApp = () => {
        const newUser = {name: '', active: false, key: Math.random()};
        setUsers([...users, newUser]);
    }

    const onPanelClose = (panelKey) => {
        setUsers(users.filter(entry => entry.key != panelKey));
    }

    const listMarkup = () => {
        return (
            <div>
                <div style={{textAlign: 'right', fontSize: 'xxx-large', textAlign: 'center'}}>
                    <span className="add-messenger-panel" onClick={addNewMessengerApp}>+</span>
                </div>
                <ul>
                {users.map(user =>
                    <MessengerApp
                        key={user.key}
                        name={user.name}
                        panelKey={user.key}
                        backend={backend}
                        onPanelClose={onPanelClose}
                    >
                    </MessengerApp>
                )}
                </ul>
            </div>
        )
    }
    return (
        listMarkup()
    )
}
export default DemoContainer;
