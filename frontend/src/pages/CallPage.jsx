import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
  name,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initcall = async () => {
      if (!tokenData.token || !authUser || !callId) return;

      try {
        console.log("Initializing stream video call client...");

        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });
        console.log("Joined call successfully!");

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call, Please try again.");
      } finally {
        setIsConnecting(false);
      }
    };
    initcall();
  }, [tokenData, authUser, callId]);

  if (isLoading || isConnecting) return <PageLoader />;
return (
  <div className="h-screen w-screen overflow-hidden flex flex-col bg-black">
    {client && call ? (
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <CallContent />
        </StreamCall>
      </StreamVideo>
    ) : (
      <div className="flex items-center justify-center h-full text-white">
        <p>Could not join the call. Please refresh.</p>
      </div>
    )}
  </div>
);

};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) {
    navigate("/");
    return null;
  }

  return (
    <StreamTheme>

      {/* Responsive wrapper */}
      <div className="flex flex-col h-screen w-screen overflow-hidden">

        {/* Video Section */}
        <div className="flex-1 min-h-0">
          <SpeakerLayout
            participantsBarPosition="bottom"
            participantsBarStyle={{
              maxHeight: "25vh",
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-2 bg-black/40">
          <CallControls 
            layout="mobile"
            variant="minimal"
          />
        </div>
      </div>
    </StreamTheme>
  );
};


export default CallPage;
