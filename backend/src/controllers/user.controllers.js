import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

        const validFriendIds = (currentUser.friends || []).filter(id => id != null);

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // (ne means not equal to) exclude current user
        { _id: { $nin: validFriendIds } }, // (nin means not in) exclude current user's friends
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.log("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error " });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic nativeLanguage learningLanguage"
      );

      const validFriends = user.friends.filter(f => f !== null);

    res.status(200).json(validFriends);
  } catch (error) {
    console.log("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error " });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res
        .status(400)
        .json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    // check if recipient exist
    if (!recipient) {
      return res.status(404).json({ message: "Recipient Not Found" });
    }

    // check if user already friends
    if (recipient.friends.includes(myId)) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({
          message: "A friend request already exists between you and this user",
        });
    }

    // create a friend request between user and recipient
    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });
    res.status(201).json(friendRequest);
  } catch (error) {
    console.log("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error " });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend Request Not Found" });
    }

    // verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the others's friends array
    //$addToSet: adds element to the array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({message: "Friend Request Accepted"});

  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({message: "Internal Server Error"});
  }
}

export async function getFriendRequests(req,res) {
    try {
        const incomingReqsRaw = await FriendRequest.find({
            recipient: req.user.id,
            status: "pending",
        }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

        const acceptedReqsRaw = await FriendRequest.find({
            sender: req.user.id,
            status: "accepted",
        }).populate("recipient", "fullName profilePic");

        const incomingReqs = incomingReqsRaw.filter(r => r.sender !== null);
    const acceptedReqs = acceptedReqsRaw.filter(r => r.recipient !== null);

        res.status(200).json({ incomingReqs, acceptedReqs })
    } catch (error) {
        console.log("Error in getFriendRequests controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function getOngoingFriends(req,res) {
    try {
        const outgoingRequestsRaw = await FriendRequest.find({
            sender: req.user.id,
            status: "pending",
        }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

            const outgoingRequests = outgoingRequestsRaw.filter(r => r.recipient !== null);
        res.status(200).json(outgoingRequests);

    } catch (error) {
        console.log("Error in getOngoingFriends controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}