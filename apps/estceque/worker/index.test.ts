// Run with: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { route } from './index'

const redirect = (from: string, to: string) =>
  assert.deepEqual(route(from), { kind: 'redirect', location: to }, from)
const gone = (from: string) =>
  assert.deepEqual(route(from), { kind: 'gone' }, from)
const serve = (from: string) => assert.equal(route(from).kind, 'serve', from)

test('old blog posts and archives are gone, in one step from any host', () => {
  // Addresses reported by Google Search Console.
  gone('http://www.estceque.org/2009/12/embarquement-immediat.html?m=1')
  gone('http://www.estceque.org/2010/05/improvisation-sonore.html?m=1')
  gone('http://www.estceque.org/2011/05/lart-du-son-1.html')
  gone('http://www.estceque.org/2010/05/la-revolution-pas-la-vaiselle.html')
  gone('http://www.estceque.org/2009_03_17_archive.html')
  gone('http://www.estceque.org/2009_03_17_archive.html?m=1')
  gone('http://www.estceque.org/2007/11/?m=0')
  gone('https://estceque.org/2010/')
  gone('https://estceque.org/p/projets.html')
})

test('old blog addresses with an equivalent redirect to it in one step', () => {
  redirect(
    'http://www.estceque.org/p/contact.html?m=1',
    'https://estceque.org/#contact'
  )
  redirect(
    'http://www.estceque.org/p/recherche.html?m=1',
    'https://estceque.org/podcasts/'
  )
  redirect(
    'http://www.estceque.org/feeds/posts/default',
    'https://feed.ausha.co/bz3KNSqWZ7nP'
  )
  redirect(
    'https://estceque.org/search/label/radio',
    'https://estceque.org/podcasts/?q=radio'
  )
  redirect(
    'http://www.estceque.org/search?q=velo&m=1',
    'https://estceque.org/podcasts/?q=velo'
  )
})

test('http, www, Blogger parameters and missing slashes: one redirect', () => {
  redirect('http://www.estceque.org/?m=1', 'https://estceque.org/')
  redirect('https://estceque.org/?m=1', 'https://estceque.org/')
  redirect('http://estceque.org/', 'https://estceque.org/')
  redirect(
    'https://www.estceque.org/podcasts/?q=radio',
    'https://estceque.org/podcasts/?q=radio'
  )
  redirect(
    'https://estceque.org/espace-scolaire',
    'https://estceque.org/espace-scolaire/'
  )
})

test('renamed pages redirect in one step', () => {
  redirect(
    'https://estceque.org/ateliers/',
    'https://estceque.org/espace-scolaire/'
  )
  redirect(
    'https://estceque.org/ateliers',
    'https://estceque.org/espace-scolaire/'
  )
  redirect(
    'http://www.estceque.org/ateliers/?m=1',
    'https://estceque.org/espace-scolaire/'
  )
})

test('pages of the new site are served as they are', () => {
  serve('https://estceque.org/')
  serve('https://estceque.org/espace-scolaire/')
  serve('https://estceque.org/studio/')
  serve('https://estceque.org/podcasts/?q=radio&public=college')
  serve('https://estceque.org/sitemap.xml')
  serve('https://estceque.org/llms.txt')
  serve('https://next.estceque.org/podcasts/')
  serve('http://localhost:8787/espace-scolaire/')
})
