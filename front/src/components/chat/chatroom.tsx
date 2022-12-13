import classNames from "classnames";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "@/components/chat/Chat";
import { currentUser } from "@/temp/userAtom";
import * as api from "@/api/chat";
import { recentlyMsgState } from "@/temp/ChatRecoil";
import { useRecoilValue, useRecoilState } from "recoil";
import { useLocation } from "react-router-dom";
import { currentroom } from "@/temp/ChatRecoil";
import {
    ChatContainer,
    LeaveButton,
    Message,
    MessageBox,
    MessageForm,
} from "@/styles/chat/chatroom-style";

interface ChatData {
    sender: string;
    msgText: string;
    chatRoom: string;
}

export const ChatRoom = (joinedRoom: any | undefined, setJoinedRoom: any) => {
    const [chats, setChats] = useState<ChatData[]>([]);
    const [msgText, setMsgText] = useState<string>("");
    // const [currentsroom, setCurrentsroom] = useRecoilState(currentroom);
    const chatContainerEl = useRef<HTMLDivElement>(null);
    // const chatRoom = currentsroom;
    let { room } = useParams();
    const chatRoom = joinedRoom?.joinedRoom;
    const [recentlyMessage, setRecentlyMessage] = useRecoilState(recentlyMsgState);
    const user = useRecoilValue(currentUser);
    // const chatRoom = currentsroom;
    const userid = String(user?.id);
    const navigate = useNavigate();
    console.log(chatRoom, joinedRoom?.joinedRoom);
    //todo : usecallback 사용하기

    // 채팅이 길어지면(chats.length) 스크롤이 생성되므로, 스크롤의 위치를 최근 메시지에 위치시키기 위함
    useEffect(() => {
        if (!chatContainerEl.current) return;

        const chatContainer = chatContainerEl.current;
        const { scrollHeight, clientHeight } = chatContainer;

        if (scrollHeight > clientHeight) {
            chatContainer.scrollTop = scrollHeight - clientHeight;
        }
        console.log(chats, chatRoom);
    }, [chats.length]);

    // message event listener
    useEffect(() => {
        const messageHandler = (chat: ChatData) => {
            if (chat === null) {
                return null;
            }
            console.log("실행", chat, chatRoom);
            if (chat.chatRoom == chatRoom && chatRoom != null) {
                setChats((prevChats) => [...prevChats, chat]);
                setRecentlyMessage(chat);
            }
        };
        const leaveRoomHandler = (chatRoom: string) => {
            // setCurrentsroom(chatRoom);
        };

        socket.on("message", messageHandler);
        socket.on("leave-room", leaveRoomHandler);
        return () => {
            socket.off("message", messageHandler);
            socket.off("leave-room", leaveRoomHandler);
        };
    }, []);

    useEffect(() => {
        console.log(chatRoom, 5443454);
        getMessegetext(chatRoom);
        // console.log("the rooms change", chatRoom);
        if (chatRoom !== undefined) {
            // setCurrentsroom(chatRoom);
            console.log(chatRoom, 54434);
        }
        setMsgText("");
    }, [joinedRoom?.joinedRoom]);

    //전체 메세지 받아오기
    const getMessegetext = async (chatRoom: string | undefined) => {
        try {
            const { data } = await api.getMessege(chatRoom);
            setChats(data.result);
            return data;
        } catch (e) {
            console.error(e);
        }
    };

    // const getRecentlyMessege = async (chatRoom: string | undefined) => {
    //     try {
    //         const { data } = await api.getMessege(chatRoom);
    //         setChats(data.result);
    //         return data;
    //     } catch (e) {
    //         console.error(e);
    //     }
    // };

    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setMsgText(e.target.value);
    }, []);

    const onSendMessage = useCallback(
        (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!msgText) return alert("메시지를 입력해 주세요.");
            if (chatRoom != null) {
                console.log(chatRoom, "is not null");
                socket.emit("message", { chatRoom, msgText, userid }, (chat: ChatData) => {
                    setChats((prevChats) => [...prevChats, chat]);
                });
                setMsgText("");
            }
        },
        [msgText, chatRoom]
    );

    const onLeaveRoom = useCallback(() => {
        socket.emit("leave-room", chatRoom, () => {});
        navigate("/");
    }, [navigate, chatRoom]);

    return (
        <>
            <LeaveButton onClick={onLeaveRoom}>
                <button>방 나가기{chatRoom}</button>
            </LeaveButton>
            <ChatContainer ref={chatContainerEl}>
                {chats.map((chat, index) =>
                    chat.chatRoom == chatRoom ? (
                        <MessageBox
                            key={index}
                            className={classNames({
                                my_message: userid === chat.sender,
                                alarm: !chat.sender,
                            })}
                        >
                            <span></span>
                            <Message className="message">{chat.msgText}</Message>
                        </MessageBox>
                    ) : (
                        ""
                    )
                )}
            </ChatContainer>
            <MessageForm onSubmit={onSendMessage}>
                <div>
                    <input type="text" onChange={onChange} value={msgText}></input>
                    <button className="submitButton">전송</button>
                </div>
            </MessageForm>
        </>
    );
};
export default ChatRoom;
