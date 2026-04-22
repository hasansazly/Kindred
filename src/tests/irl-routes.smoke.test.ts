import assert from 'node:assert/strict';
import test from 'node:test';

import * as irlReadyPost from '@/app/api/irl/ready/route';
import * as irlReadyGet from '@/app/api/irl/ready/[matchId]/route';
import * as irlIntentionPost from '@/app/api/irl/intention/route';
import * as irlIntentionGet from '@/app/api/irl/intention/[matchId]/route';
import * as irlReflectionPost from '@/app/api/irl/reflection/route';

test('IRL API routes export expected handlers', () => {
  assert.equal(typeof irlReadyPost.POST, 'function');
  assert.equal(typeof irlReadyGet.GET, 'function');
  assert.equal(typeof irlIntentionPost.POST, 'function');
  assert.equal(typeof irlIntentionGet.GET, 'function');
  assert.equal(typeof irlReflectionPost.POST, 'function');
});
