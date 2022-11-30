import { useState, forwardRef, useMemo, ForwardedRef } from "react";
import { CardSection, Post, PostDetail, MessageBlock } from "@/styles/home/postList-style";

interface Items {
    id: number;
    title: string;
    description: string;
    emotion: string;
    createdAt: Date;
}

interface Props {
    post: Items;
}

function PostItem({ post }: Props, ref: ForwardedRef<HTMLElement>) {
    const [isOpen, setIsOpen] = useState(false);
    const [like, setLike] = useState(false);
    const { id, emotion, title, description, createdAt } = post;

    const onClick = () => {
        setIsOpen((prev) => !prev);
    };

    const onToggle = () => {
        setLike((prev) => !prev);
    };

    const dateTime = (date: Date) => {
        const milliSeconds = Number(new Date()) - Number(date);
        const seconds = milliSeconds / 1000;
        if (seconds < 60) return `방금 전`;
        const minutes = seconds / 60;
        if (minutes < 60) return `${Math.floor(minutes)}분 전`;
        const hours = minutes / 60;
        if (hours < 24) return `${Math.floor(hours)}시간 전`;
        const dateString = date.toLocaleDateString();
        return dateString;
    };

    const nowDate = dateTime(new Date(createdAt));

    const itemBody = useMemo(() => {
        return (
            <>
                <Post onClick={onClick} isOpen={isOpen} emotion={emotion}>
                    <span className="emotion">{id}</span>
                    <span className="title">{title}</span>
                    <div className="time">
                        <span>{nowDate}</span>
                        <span className="arrow">{isOpen ? "▲" : "▼"}</span>
                    </div>
                </Post>
                {isOpen && (
                    <PostDetail>
                        <p className="description">{description}</p>
                        <div>
                            <MessageBlock>
                                <input
                                    type="text"
                                    placeholder="메시지는 익명으로 전송됩니다. 속마음을 나눠보세요!"
                                    autoFocus
                                />
                                <button className="submitButton">전송</button>
                            </MessageBlock>
                            <button
                                className={like ? "material-icons" : "material-symbols-outlined"}
                                onClick={onToggle}
                            >
                                thumb_up
                            </button>
                        </div>
                    </PostDetail>
                )}
            </>
        );
    }, [isOpen, like, post]);

    return ref ? (
        <CardSection ref={ref}>{itemBody}</CardSection>
    ) : (
        <CardSection>{itemBody}</CardSection>
    );
}

export default forwardRef(PostItem);
