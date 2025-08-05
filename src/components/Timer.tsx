import moment from 'moment';
import AppText from './customs/AppText';

import { useEffect, useState } from 'react';
import { View } from 'react-native';

interface TimerProps {
    targetDate: string;
}

const Timer: React.FC<TimerProps> = ({ targetDate }) => {
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        const target = moment(targetDate);
        if (!target.isValid()) {
            setTimeRemaining('Invalid Date');
            return;
        }

        const updateTimer = () => {
            const now = moment();
            const diff = moment.duration(target.diff(now));

            if (diff.asMilliseconds() <= 0) {
                setTimeRemaining('00hr: 00min: 00sec');
                return;
            }

            const format = (val: number) => String(Math.floor(val)).padStart(2, '0');
            const days = diff.days() ? `${format(diff.days())}Days: ` : '';
            const hr = format(diff.hours());
            const min = format(diff.minutes());
            const sec = format(diff.seconds());

            setTimeRemaining(`${days}${hr}hr: ${min}min: ${sec}sec`);
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);
        return () => clearInterval(intervalId);
    }, [targetDate]);

    const isExpired = timeRemaining === '00hr: 00min: 00sec';
    return (
        <View className="flex-row items-center justify-start ">
            <View className="bg-red-50 px-2 py-1 rounded-md ">
                <AppText weight='bold' size='xs' className="text-gray-700">
                    {isExpired ? 'Event Expired' : 'Event ends in -'}
                </AppText>
            </View>
            {!isExpired && (
                <AppText weight='bold' size='xs' className="ml-1  text-gray-700">
                    {timeRemaining}
                </AppText>
            )}
        </View>
    );
};

export default Timer;

