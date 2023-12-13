/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Auth } from "firebase/auth";
import { useEffect, useState } from "react";
import { Character } from "../../global_classes/Character";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight} from "lucide-react";
import ChatWindow from "./chat-window";
import UserPersonaWindow from "./user-persona";
import ChatSettings from "./chat-settings";
import ContactsBox from "./contacts-box";
import { getCharacter } from "../../firebase_api/characterAPI";
import { StoredChatLog } from "../../global_classes/StoredChatLog";
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { useWindowSize } from "../../helpers/character-card";
import CharacterPopup from "../../components/shared/character-popup";
import ChatLogs from './chat-logs';
import { useCloseSidesListener } from '../../helpers/events';

interface ChatPageProps {
    auth: Auth;
    logout: () => void;
    isProduction: boolean;
}

const ChatPage = (props: ChatPageProps) => {
    const { auth, logout, isProduction } = props;
    const navigate = useNavigate();

    useEffect(() => {
        auth.authStateReady().then(() => {
            if(auth.currentUser === null){
                navigate('/login?location=chat');
            }
        });
    }, [auth, navigate]);

    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [selectedChat, setSelectedChat] = useState<StoredChatLog | null>(null);
    const [showCharacterPopup, setShowCharacterPopup] = useState<boolean>(false);
    const [characterPopupCharacter, setCharacterPopupCharacter] = useState<Character | null>(null);

    const location = useLocation();
    const [width] = useWindowSize();

    const isDesktop = width >= 1024;
    
    const queryParams = new URLSearchParams(location.search);
    const characterID = queryParams.get('characterID');

    // State variables to control drawer open/close
    const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
    const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

    // Handlers to toggle drawers
    const toggleLeftDrawer = () => setIsLeftDrawerOpen(!isLeftDrawerOpen);
    const toggleRightDrawer = () => setIsRightDrawerOpen(!isRightDrawerOpen);
    
    useEffect(() => {
        if(characterID === null) return;
        const retrieveCharacter = async () => {
            const character = await getCharacter(characterID).then((character) => {
                return character;
            });
            if(!character) return;
            if((character.verification_info?.status !== 'approved') && (character.creator !== auth?.currentUser?.uid)) return;
            setSelectedCharacter(character)
        }
        retrieveCharacter();
    }, [characterID, auth]);
    
    const handleCharacterSelect = (character: Character) => {
        setSelectedCharacter(character);
        setShowCharacterPopup(false);
        setIsLeftDrawerOpen(false);
    }

    const handleCharacterPopupToggle = (character?: Character) => {
        if(character) setCharacterPopupCharacter(character);
        setIsLeftDrawerOpen(false);
        setIsRightDrawerOpen(false);
        setShowCharacterPopup(!showCharacterPopup);
    }

    useCloseSidesListener(() => {
        setIsLeftDrawerOpen(false);
        setIsRightDrawerOpen(false);
    });
    
    return (
        <div className="grid grid-cols-12 w-full h-[92.5vh] max-h-[92.5vh] gap-2 md:p-4 text-base-content">
            <CharacterPopup isOpen={showCharacterPopup} toggleModal={handleCharacterPopupToggle} character={characterPopupCharacter}/>
            <>
            {isDesktop ? (
                <>
                    <div className="col-span-3 md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 p-2 max-h-[90vh]">
                        <h3 className="font-bold justify-between flex flex-row">
                            Contacts
                            <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div>
                        </h3>
                        <ContactsBox auth={auth} logout={logout} isProduction={isProduction} character={selectedCharacter} setCharacter={handleCharacterSelect} showCharacterPopup={handleCharacterPopupToggle}/>
                        <h3 className="font-bold justify-between flex flex-row">
                            You
                            <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div>
                        </h3>
                        <UserPersonaWindow auth={auth} logout={logout} isProduction={isProduction} persona={null} setPersona={() => {}}/>
                    </div>
                </>
            ) : (
                <SwipeableDrawer
                    anchor="left"
                    open={isLeftDrawerOpen}
                    onClose={toggleLeftDrawer}
                    onOpen={toggleLeftDrawer}
                    variant="temporary"
                    transitionDuration={250}
                    className="bg-transparent"
                >
                    <div className="col-span-3 md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 p-2">
                        <h3 className="font-bold justify-between flex flex-row">
                            Contacts
                            <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div>
                        </h3>
                        <ContactsBox auth={auth} logout={logout} isProduction={isProduction} character={selectedCharacter} setCharacter={handleCharacterSelect} showCharacterPopup={handleCharacterPopupToggle}/>
                        <h3 className="font-bold justify-between flex flex-row">
                            You
                            <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div>
                        </h3>
                        <UserPersonaWindow auth={auth} logout={logout} isProduction={isProduction} persona={null} setPersona={() => {}}/>
                        <button className="dy-btn dy-btn-error dy-btn-outline dy-btn-sm md:hidden" onClick={toggleLeftDrawer}>
                            <ArrowRight/>
                        </button>
                    </div>
                </SwipeableDrawer>
            )}
            </>
            <ChatWindow auth={auth} character={selectedCharacter} logout={logout} isProduction={isProduction} persona={null} theme={null} toggleLeftDrawer={toggleLeftDrawer} toggleRightDrawer={toggleRightDrawer} showCharacterPopup={handleCharacterPopupToggle}/>
            {isDesktop ? (
                <div className="col-span-2 shadow-xl md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 text-right p-2 max-h-[90vh]">
                    <h3 className="font-bold text-right flex flex-row-reverse justify-between">
                        Chat Settings
                        <div className="flex gap-1">
                            <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                <ArrowLeft/>
                            </button>
                            <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                <ArrowRight/>
                            </button>
                        </div>
                    </h3>
                    <ChatSettings auth={auth} logout={logout} isProduction={isProduction} theme={null} setTheme={() => {}}/>
                    <h3 className="font-bold text-right flex flex-row-reverse justify-between">
                        Chats
                        <div className="flex gap-1">
                            <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                <ArrowLeft/>
                            </button>
                            <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                <ArrowRight/>
                            </button>
                        </div>
                    </h3>
                    <div className="flex flex-col gap-2 rounded-box bg-base-100 h-full">
                        <ChatLogs auth={auth} logout={logout} isProduction={isProduction} character={selectedCharacter} showCharacterPopup={handleCharacterPopupToggle}/>
                    </div>
                </div>
            ) : (
                <SwipeableDrawer
                    anchor="right"
                    open={isRightDrawerOpen}
                    onClose={toggleRightDrawer}
                    onOpen={toggleRightDrawer}
                    variant="temporary"
                    transitionDuration={250}
                    className="bg-transparent"
                >
                    <div className="col-span-2 shadow-xl bg-base-300 md:p-4 h-full flex flex-col gap-2 text-right p-2">
                        <h3 className="font-bold text-right flex flex-row-reverse justify-between">
                            Chat Settings
                            <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div>
                        </h3>
                        <ChatSettings auth={auth} logout={logout} isProduction={isProduction} theme={null} setTheme={() => {}}/>
                        <h3 className="font-bold text-right flex flex-row-reverse justify-between">
                            Chats
                            <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div>
                        </h3>
                        <div className="flex flex-col gap-2 rounded-box bg-base-100 h-full">
                            <ChatLogs auth={auth} logout={logout} isProduction={isProduction} character={selectedCharacter} showCharacterPopup={handleCharacterPopupToggle}/>
                        </div>
                        <button className="dy-btn dy-btn-error dy-btn-outline dy-btn-sm md:hidden" onClick={toggleRightDrawer}>
                            <ArrowLeft/>
                        </button>
                    </div>
                </SwipeableDrawer>
            )}
        </div>
    )
}
export default ChatPage;