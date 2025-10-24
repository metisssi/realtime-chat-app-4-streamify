import { useParams } from "react-router"
import { useEffect, useState } from "react"
import useAuthUser from "../hooks/useAuthUser"
import { useQuery } from "@tanstack/react-query"
import { getStreamToken } from "../lib/api"


import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";



import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat"
import toast from "react-hot-toast"

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY

const ChatPage = () => {

  const { id: targetUserId } = useParams()

  const [chatClient, setChatClient] = useState(null)
  const [channel, setChannel] = useState(null)
  const [loading, setLoading] = useState(true)


  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser // this will run only when authUser is avaible 
  })

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return

      try {
        console.log("Initializing stream chat client...")

        const client = StreamChat.getInstance(STREAM_API_KEY)

        await client.connectUser({
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic
        }, tokenData.token)

        const channelId =[authUser._id, targetUserId].sort().join("-")

        // you and me 
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [youtId, myId] => [myId, yourId]

        const currChanel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId]
        })

        await currChanel.watch();

        setChatClient(client)
        setChannel(currChanel)
      } catch (error) {
          console.log("Error inintializing chat:", error);
          toast.error("Could not connect to chat, Please try again.")
      }finally{
        setLoading(false)
      }
    }

    initChat()
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if(channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`

      channel.sendMessage({
        text: `I'have started a video call. Join me here: ${callUrl}`, 
      })

      toast.success("Video call link sent successfully")
    }
  }

  if(loading || !chatClient || !channel) return <ChatLoader />

  return (
    <div className="h-[93vh]">

      <Chat client={chatClient}>
        <Channel channel={channel}>
            <div className="w-full relative">

              <CallButton handleVideoCall={handleVideoCall}/>

              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput focus />
              </Window>

            </div>

            <Thread/>
        </Channel>
      </Chat>

    </div>
  )
}

export default ChatPage