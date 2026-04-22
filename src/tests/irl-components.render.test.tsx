import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import IRLReadyButton from '@/components/irl/IRLReadyButton';
import IRLIntentionCheck from '@/components/irl/IRLIntentionCheck';
import IRLActivitySuggestion from '@/components/irl/IRLActivitySuggestion';
import IRLPostDateReflection from '@/components/irl/IRLPostDateReflection';

test('IRLReadyButton renders', () => {
  const html = renderToStaticMarkup(
    <IRLReadyButton
      viewerUserId="user-1"
      participantUserIds={['user-1', 'user-2']}
      readyUserIds={[]}
      onReady={async () => {}}
    />
  );
  assert.ok(html.includes('IRL Date Track'));
});

test('IRLIntentionCheck renders', () => {
  const html = renderToStaticMarkup(
    <IRLIntentionCheck
      viewerUserId="user-1"
      participantUserIds={['user-1', 'user-2']}
      submittedUserIds={[]}
      bothReady
      bothSubmitted={false}
      answersVisible={false}
      answersByUser={null}
      onSubmit={async () => {}}
    />
  );
  assert.ok(html.includes('Pre-date intention check'));
});

test('IRLActivitySuggestion renders', () => {
  const html = renderToStaticMarkup(
    <IRLActivitySuggestion
      suggestion={{
        category: 'quiet/intimate',
        title: 'Quiet date',
        summary: 'Low pressure',
        ideas: ['Tea walk'],
      }}
    />
  );
  assert.ok(html.includes('Suggested date vibe'));
});

test('IRLPostDateReflection renders', () => {
  const html = renderToStaticMarkup(
    <IRLPostDateReflection
      reflectionDueAt={new Date().toISOString()}
      dueNow
      alreadySubmitted={false}
      submittedReflection={null}
      onSubmit={async () => {}}
    />
  );
  assert.ok(html.includes('How did it feel?'));
});
