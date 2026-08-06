import Notification from "../models/notification.model.js";
import { emitToUser } from "./socket.js";

export const notify = async ({ recipient, sender, type, message, link }) => {
  try {
    if (!recipient) return;
    if (sender && recipient.toString() === sender.toString()) return; // don't notify yourself

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      link,
    });

    const populated = await notification.populate(
      "sender",
      "name profilePicture",
    );

    emitToUser(recipient, "notification", populated);
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};
