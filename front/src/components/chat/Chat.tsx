import { Container, FlexBox } from "@/styles/chat/chat-style";
import { io } from "socket.io-client";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { currentidUser } from "@/temp/userAtom";
import * as api from "@/api/chat";
import { Head, ChatRoomstyle } from "@/styles/chat/waiting-room.styles";
import { recentlyMsgState } from "@/temp/ChatRecoil";
import { useRecoilValue, useRecoilState } from "recoil";
import ChatRoom from "@/components/chat/chatroom";
import WaitingRoom from "@/components/chat/waiting-room";
export const socket = io("http://localhost:4000");
import { currentroom, chatListState } from "@/temp/ChatRecoil";
//채팅 상자
interface ChatData {
    sender: string;
    msgText: string;
    chatRoom: string;
}
interface CreateRoomResponse {
    success: boolean;
    payload: string;
}
//채팅방 목록
interface ChatList {
    updatedAt: string;
    user_model_id: string;
    lastmessage: string;
    count: string;
}

export function Chat() {
    const [chats, setChats] = useState<ChatData[]>([]);
    const [joinedRoom, setJoinedRoom] = useState<string>();
    const [count, setCount] = useState<string>();
    const [currentsroom, setCurrentsroom] = useRecoilState(currentroom);
    const chatContainerEl = useRef<HTMLDivElement>(null);
    let { roomName } = useParams<"roomName">();
    const chatRoom = roomName;
    let { room } = useParams();
    // const [currentsroom, setCurrentsroom] = useRecoilState(currentroom);
    const user = useRecoilValue(currentidUser);
    const current_room = useRecoilValue(currentroom);
    const userid = String(user?.id);
    const [recentMessage, setRecentMessage] = useRecoilState(recentlyMsgState);
    // const [chatList, setChatList] = useRecoilState(chatListState);

    const navigate = useNavigate();
    const [chatList, setChatList] = useState<
        | {
              updatedAt: string;
              user_model_id: string;
              lastmessage: string;
              count: string;
          }[]
        | null
    >(null);
    useEffect(() => {
        //메세지 헨들러가 2개?

        const leaveRoomHandler = (roomName: string) => {
            setCurrentsroom(roomName);
        };
        const roomListHandler = (rooms: string[]) => {
            // getMessegetext(rooms[0], userid);
        };

        const createRoomHandler = (response: any, usermodel: string) => {
            response.result.map(async (item: any, index: number) => {
                const countresult = await api.getCountMessege(item.user_model_id, userid);
                response.result[index]["count"] = countresult.data.result;
                // setCount(countresult.data.result);
            });
            if (userid == usermodel) {
                response.result.map(async (item: ChatList, index: number) => {
                    const countresult = await api.getCountMessege(item.user_model_id, userid);
                    response.result[index]["count"] = countresult.data.result;
                });
                setChatList(response.result);
            }
        };

        const messageHandler = (chat: ChatData) => {
            setRecentMessage({
                sender: chat.sender,
                msgText: chat.msgText,
                chatRoom: chat.chatRoom,
            });
            if (chatList !== null) {
                chatList.map(async (item: ChatList, index: number) => {
                    const countresult = await api.getCountMessege(item.user_model_id, userid);
                    chatList[index]["count"] = countresult.data.result;
                });
            }

            setChatList((prev) => {
                return prev!.map((item) => {
                    if (item.user_model_id == chat.chatRoom) {
                        item.lastmessage = chat.msgText;
                        item.updatedAt = "방금 전";
                        if (chat.sender == userid) {
                            item.count = "0";
                        }
                        item.count = item.count;
                    }
                    return item;
                });
            });
            // }
        };

        socket.emit("room-list", String(user?.id), () => {}, []);

        socket.on("leave-room", leaveRoomHandler);
        socket.on("message", messageHandler);
        socket.on("create-room", createRoomHandler);
        return () => {
            socket.off("leave-room", leaveRoomHandler);
            socket.off("message", messageHandler);
        };
    }, []);

    useEffect(() => {
        // socket handler

        const messageHandler = (chat: ChatData) => {
            setRecentMessage({
                sender: chat.sender,
                msgText: chat.msgText,
                chatRoom: chat.chatRoom,
            });

            setChatList((prev) => {
                return prev!.map((item) => {
                    if (item.user_model_id == chat.chatRoom) {
                        item.lastmessage = chat.msgText;
                        item.updatedAt = "방금 전";
                        if (chat.sender == userid) {
                            item.count = "0";
                        } else {
                            item.count = String(Number(item.count) + 0.5);
                        }
                    }
                    return item;
                });
            });
            // }
        };
        socket.on("message", messageHandler);
        return () => {
            socket.off("message", messageHandler);
        };
    }, [chatList]);

    const setCountZero = () => {
        setChatList((prev) => {
            return prev!.map((item) => {
                item.count = "0";
                return item;
            });
        });
    };
    const onJoinRoom = useCallback(
        (roomName: string) => async () => {
            // onLeaveRoom(roomName);
            socket.emit("join-room", roomName, user?.id, () => {});
            socket.emit("leave-room", roomName, () => {});
            // navigate(`/diary/room/${roomName}`);
            setCountZero();
            await api.readMessege(roomName, userid);

            setCurrentsroom(roomName);
            setJoinedRoom(roomName);
            return () => {};
        },
        [navigate]
    );
    const ChatRoomComponents = useMemo(() => {
        if (chatList === null) {
            return null;
        }
        return (
            <>
                {chatList.map((item, idx) => (
                    <ChatRoomstyle onClick={onJoinRoom(item.user_model_id)} key={idx}>
                        <button>{item.lastmessage}</button>
                        <div>
                            <div>{item.count}</div>
                            <span> {item.updatedAt}</span>
                        </div>
                    </ChatRoomstyle>
                ))}
            </>
        );
    }, [chatList]);

    const onCreateRoom = useCallback(() => {
        const roomName = prompt("방 이름을 입력해 주세요.");
        if (!roomName) return alert("방 이름은 반드시 입력해야 합니다.");

        socket.emit("create-room", roomName, (response: CreateRoomResponse) => {
            if (!response.success) return alert(response.payload);

            navigate(`/room/${response.payload}`);
        });
    }, [navigate]);

    return (
        <>
            <FlexBox>
                <span>
                    <Container>
                        <Head>
                            <div>채팅방 목록</div>
                            <button onClick={onCreateRoom}>채팅방 생성</button>
                        </Head>
                        {chatList && ChatRoomComponents}
                    </Container>
                </span>
                <Container>
                    {joinedRoom && (
                        // <Routes>
                        //     <Route path="/room/:roomName" element={<ChatRoom />} />
                        // </Routes>
                        <ChatRoom
                            joinedRoom={joinedRoom}
                            setJoinedRoom={setJoinedRoom}
                            focusEvent={() => setCountZero()}
                        />
                    )}
                </Container>
            </FlexBox>
        </>
    );
}
