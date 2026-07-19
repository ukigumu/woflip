import { View } from 'react-native';

import { TwoWeekGrid } from '@/components/two-week-grid';
import { Caption, Heading } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Sheet } from '@/components/ui/sheet';
import { getMembers } from '@/lib/store';

interface Props {
  /** Miembro cuyo horario se muestra; null = cerrado. */
  memberId: string | null;
  onDismiss: () => void;
}

/** Sheet con el calendario de 2 semanas de un compañero (o el propio). */
export function MemberScheduleSheet({ memberId, onDismiss }: Props) {
  return (
    <Sheet visible={memberId !== null} onDismiss={onDismiss}>
      {memberId ? <ScheduleBody key={memberId} memberId={memberId} /> : null}
    </Sheet>
  );
}

function ScheduleBody({ memberId }: { memberId: string }) {
  const member = getMembers().find((m) => m.id === memberId);
  if (!member) return null;
  const masked = !member.isMe && !member.shareFullSchedule;

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar
          name={member.name}
          initial={member.isMe ? 'T' : undefined}
          photoUri={member.photoUri}
          size={32}
        />
        <Heading>{member.isMe ? 'Tú' : member.name}</Heading>
      </View>

      <TwoWeekGrid memberId={member.id} masked={masked} />

      {masked ? (
        <Caption color="secondary">
          El turno exacto (M, T, P…) solo se ve si el compañero comparte su horario.
        </Caption>
      ) : null}
    </View>
  );
}
