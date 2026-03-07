import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type EqAlert = {
  magnitude: number;
  district: string;
  province: string;
  stateNo: number | string;
  occurredAtISO: string;
};

const formatNPT = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kathmandu',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kathmandu',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return { date, time };
};

export async function sendEmergencyAlert(eq: EqAlert) {
  const { date, time } = formatNPT(eq.occurredAtISO);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Emergency Alert ⚠️',
      body:
        `Earthquake - Drop, Cover, Hold\n` +
        `Mag ${eq.magnitude.toFixed(1)} eq in ${eq.district}, Nepal\n` +
        `${eq.province}, State No: ${eq.stateNo}, on ${date} at ${time} NPT`,
      sound: true,
    },
    trigger: null,
  });
}