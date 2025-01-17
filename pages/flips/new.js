import React, {useEffect, useState} from 'react'
import {useRouter} from 'next/router'
import {Box, Flex, useToast, Divider, useDisclosure} from '@chakra-ui/react'
import {useTranslation} from 'react-i18next'
import {useMachine} from '@xstate/react'
import {Page} from '../../screens/app/components'
import {
  FlipMasterFooter,
  FlipPageTitle,
  FlipMaster,
  FlipMasterNavbar,
  FlipMasterNavbarItem,
  FlipStoryStep,
  FlipStepBody,
  FlipKeywordPanel,
  FlipKeywordTranslationSwitch,
  CommunityTranslations,
  FlipKeyword,
  FlipKeywordName,
  FlipStoryAside,
  FlipEditorStep,
  FlipShuffleStep,
  FlipSubmitStep,
  CommunityTranslationUnavailable,
  PublishFlipDrawer,
  FlipProtectStep,
} from '../../screens/flips/components'
import Layout from '../../shared/components/layout'
import {
  flipMasterMachine,
  imageSearchMachine,
} from '../../screens/flips/machines'
import {
  publishFlip,
  isPendingKeywordPair,
  getRandomKeywordPair,
  protectFlip,
  prepareAdversarialImages,
  shuffleAdversarial,
} from '../../screens/flips/utils'
import {Step} from '../../screens/flips/types'
import {
  IconButton,
  SecondaryButton,
  PrimaryButton,
} from '../../shared/components/button'
import {Toast} from '../../shared/components/components'
import db from '../../shared/utils/db'
import {useAuthState} from '../../shared/providers/auth-context'
import {redact} from '../../shared/utils/logs'
import {useIdentity} from '../../shared/providers/identity-context'
import {useEpoch} from '../../shared/providers/epoch-context'
import {BadFlipDialog} from '../../screens/validation/components'
import {InfoIcon, RefreshIcon} from '../../shared/components/icons'
import {useTrackTx} from '../../screens/ads/hooks'
import {useFailToast} from '../../shared/hooks/use-toast'
import {eitherState} from '../../shared/utils/utils'

export default function NewFlipPage() {
  const {t, i18n} = useTranslation()
  const router = useRouter()

  const toast = useToast()

  const epochState = useEpoch()
  const {privateKey} = useAuthState()
  const [, {waitFlipsUpdate}] = useIdentity()

  const failToast = useFailToast()

  const [didShowShuffleAdversarial, setDidShowShuffleAdversarial] = useState(
    false
  )

  const [currentSearch, sendSearch] = useMachine(imageSearchMachine, {
    actions: {
      onError: (_, {data: {message}}) => {
        console.log(`ERROR ${message}`)
      },
    },
  })

  const [current, send] = useMachine(flipMasterMachine, {
    context: {
      locale: 'en',
    },
    services: {
      prepareFlip: async ({wordPairs}) => {
        // eslint-disable-next-line no-shadow
        const didShowBadFlip = (() => {
          try {
            return localStorage.getItem('didShowBadFlipNew')
          } catch {
            return false
          }
        })()

        if (!wordPairs || wordPairs.every(({used}) => used))
          return {
            keywordPairId: 0,
            availableKeywords: [getRandomKeywordPair()],
            didShowBadFlip,
          }

        const persistedFlips = await db.table('ownFlips').toArray()

        // eslint-disable-next-line no-shadow
        const availableKeywords = wordPairs.filter(
          ({id, used}) => !used && !isPendingKeywordPair(persistedFlips, id)
        )

        // eslint-disable-next-line no-shadow
        const [{id: keywordPairId}] = availableKeywords

        return {
          keywordPairId,
          availableKeywords,
          didShowBadFlip,
        }
      },
      protectFlip: async flip => protectFlip(flip),
      loadAdversarial: async flip => {
        if (
          !flip.adversarialImages.some(x => x) &&
          !eitherState(currentSearch, 'searching')
        ) {
          sendSearch('SEARCH', {
            query: `${flip.keywords.words[0]?.name} ${flip.keywords.words[1]?.name}`,
          })
        }
        return Promise.resolve()
      },
      shuffleAdversarial: async flip =>
        shuffleAdversarial(flip, setDidShowShuffleAdversarial),
      submitFlip: async context => {
        const result = await publishFlip(context)
        waitFlipsUpdate()
        return result
      },
    },
    actions: {
      onError: (_, {data}) => {
        failToast(data.response?.data?.error ?? data.message)
      },
    },
    logger: msg => console.log(redact(msg)),
  })

  useEffect(() => {
    if (eitherState(currentSearch, 'done')) {
      prepareAdversarialImages(
        currentSearch.context.images,
        send
      ).catch(() => {})
    }
  }, [currentSearch, send])

  useEffect(() => {
    if (epochState && privateKey) {
      send('PREPARE_FLIP', {epoch: epochState.epoch, privateKey})
    }
  }, [epochState, privateKey, send])

  const {
    availableKeywords,
    keywordPairId,
    keywords,
    images,
    protectedImages,
    adversarialImages,
    adversarialImageId,
    originalOrder,
    order,
    showTranslation,
    isCommunityTranslationsExpanded,
    didShowBadFlip,
    txHash,
  } = current.context

  const not = state => !current.matches({editing: state})
  const is = state => current.matches({editing: state})
  const either = (...states) =>
    eitherState(current, ...states.map(s => ({editing: s})))

  const isOffline = is('keywords.loaded.fetchTranslationsFailed')

  const {
    isOpen: isOpenBadFlipDialog,
    onOpen: onOpenBadFlipDialog,
    onClose: onCloseBadFlipDialog,
  } = useDisclosure()

  const publishDrawerDisclosure = useDisclosure()

  useTrackTx(txHash, {
    onMined: React.useCallback(() => {
      send({type: 'FLIP_MINED'})
      router.push('/flips/list')
    }, [router, send]),
  })

  return (
    <Layout showHamburger={false}>
      <Page px={0} py={0}>
        <Flex
          direction="column"
          flex={1}
          alignSelf="stretch"
          px={20}
          pb="36px"
          overflowY="auto"
        >
          <FlipPageTitle
            onClose={() => {
              if (images.some(x => x))
                toast({
                  status: 'success',
                  // eslint-disable-next-line react/display-name
                  render: () => (
                    <Toast title={t('Flip has been saved to drafts')} />
                  ),
                })
              router.push('/flips/list')
            }}
          >
            {t('New flip')}
          </FlipPageTitle>
          {current.matches('editing') && (
            <FlipMaster>
              <FlipMasterNavbar>
                <FlipMasterNavbarItem
                  step={is('keywords') ? Step.Active : Step.Completed}
                >
                  {t('Think up a story')}
                </FlipMasterNavbarItem>
                <FlipMasterNavbarItem
                  step={
                    // eslint-disable-next-line no-nested-ternary
                    is('images')
                      ? Step.Active
                      : is('keywords')
                      ? Step.Next
                      : Step.Completed
                  }
                >
                  {t('Select images')}
                </FlipMasterNavbarItem>
                <FlipMasterNavbarItem
                  step={
                    // eslint-disable-next-line no-nested-ternary
                    is('protect')
                      ? Step.Active
                      : is('keywords') || is('images')
                      ? Step.Next
                      : Step.Completed
                  }
                >
                  {t('Protect images')}
                </FlipMasterNavbarItem>
                <FlipMasterNavbarItem
                  step={
                    // eslint-disable-next-line no-nested-ternary
                    is('shuffle')
                      ? Step.Active
                      : not('submit')
                      ? Step.Next
                      : Step.Completed
                  }
                >
                  {t('Shuffle images')}
                </FlipMasterNavbarItem>
                <FlipMasterNavbarItem
                  step={is('submit') ? Step.Active : Step.Next}
                >
                  {t('Submit flip')}
                </FlipMasterNavbarItem>
              </FlipMasterNavbar>
              {is('keywords') && (
                <FlipStoryStep>
                  <FlipStepBody minH="180px">
                    <Box>
                      <FlipKeywordPanel>
                        {is('keywords.loaded') && (
                          <>
                            <FlipKeywordTranslationSwitch
                              keywords={keywords}
                              showTranslation={showTranslation}
                              locale={i18n.language}
                              onSwitchLocale={() => send('SWITCH_LOCALE')}
                            />
                            {(i18n.language || 'en').toUpperCase() !== 'EN' &&
                              !isOffline && (
                                <>
                                  <Divider
                                    borderColor="gray.100"
                                    mx={-10}
                                    mt={4}
                                    mb={6}
                                  />
                                  <CommunityTranslations
                                    keywords={keywords}
                                    onVote={e => send('VOTE', e)}
                                    onSuggest={e => send('SUGGEST', e)}
                                    isOpen={isCommunityTranslationsExpanded}
                                    isPending={is(
                                      'keywords.loaded.fetchedTranslations.suggesting'
                                    )}
                                    onToggle={() =>
                                      send('TOGGLE_COMMUNITY_TRANSLATIONS')
                                    }
                                  />
                                </>
                              )}
                          </>
                        )}
                        {is('keywords.failure') && (
                          <FlipKeyword>
                            <FlipKeywordName>
                              {t('Missing keywords')}
                            </FlipKeywordName>
                          </FlipKeyword>
                        )}
                      </FlipKeywordPanel>
                      {isOffline && <CommunityTranslationUnavailable />}
                    </Box>
                    <FlipStoryAside>
                      <IconButton
                        icon={<RefreshIcon boxSize={5} />}
                        isDisabled={availableKeywords.length < 2}
                        onClick={() => send('CHANGE_KEYWORDS')}
                      >
                        {t('Change words')}{' '}
                        {availableKeywords.length > 1
                          ? `(#${keywordPairId + 1})`
                          : null}
                      </IconButton>
                      <IconButton
                        icon={<InfoIcon boxSize={5} />}
                        onClick={onOpenBadFlipDialog}
                      >
                        {t('What is a bad flip')}
                      </IconButton>
                    </FlipStoryAside>
                  </FlipStepBody>
                </FlipStoryStep>
              )}
              {is('images') && (
                <FlipEditorStep
                  keywords={keywords}
                  showTranslation={showTranslation}
                  originalOrder={originalOrder}
                  images={images}
                  adversarialImages={adversarialImages}
                  adversarialImageId={adversarialImageId}
                  onChangeImage={(image, currentIndex) =>
                    send('CHANGE_IMAGES', {image, currentIndex})
                  }
                  // eslint-disable-next-line no-shadow
                  onChangeOriginalOrder={order =>
                    send('CHANGE_ORIGINAL_ORDER', {order})
                  }
                  onPainting={() => send('PAINTING')}
                  onChangeAdversarialId={newIndex => {
                    send('CHANGE_ADVERSARIAL_ID', {newIndex})
                  }}
                />
              )}
              {is('protect') && (
                <FlipProtectStep
                  keywords={keywords}
                  showTranslation={showTranslation}
                  originalOrder={originalOrder}
                  images={images}
                  protectedImages={protectedImages}
                  adversarialImages={adversarialImages}
                  adversarialImageId={adversarialImageId}
                  didShowShuffleAdversarial={didShowShuffleAdversarial}
                  onProtecting={() => send('PROTECTING')}
                  onProtectImage={(image, currentIndex) =>
                    send('CHANGE_PROTECTED_IMAGES', {image, currentIndex})
                  }
                  onChangeAdversarial={image =>
                    send('CHANGE_ADVERSARIAL_IMAGE', {image})
                  }
                  onShowAdversarialShuffle={() =>
                    setDidShowShuffleAdversarial(true)
                  }
                />
              )}
              {is('shuffle') && (
                <FlipShuffleStep
                  images={protectedImages}
                  originalOrder={originalOrder}
                  order={order}
                  onShuffle={() => send('SHUFFLE')}
                  onManualShuffle={nextOrder =>
                    send('MANUAL_SHUFFLE', {order: nextOrder})
                  }
                  onReset={() => send('RESET_SHUFFLE')}
                />
              )}
              {is('submit') && (
                <FlipSubmitStep
                  keywords={keywords}
                  showTranslation={showTranslation}
                  locale={i18n.language}
                  onSwitchLocale={() => send('SWITCH_LOCALE')}
                  originalOrder={originalOrder}
                  order={order}
                  images={protectedImages}
                />
              )}
            </FlipMaster>
          )}
        </Flex>
        <FlipMasterFooter>
          {not('keywords') && (
            <SecondaryButton
              isDisabled={
                is('images.painting') ||
                is('protect.protecting') ||
                is('protect.shuffling') ||
                is('protect.preparing')
              }
              onClick={() => send('PREV')}
            >
              {t('Previous step')}
            </SecondaryButton>
          )}
          {not('submit') && (
            <PrimaryButton
              isDisabled={
                is('images.painting') ||
                is('protect.protecting') ||
                is('protect.shuffling') ||
                is('protect.preparing')
              }
              onClick={() => send('NEXT')}
            >
              {t('Next step')}
            </PrimaryButton>
          )}
          {is('submit') && (
            <PrimaryButton
              isDisabled={is('submit.submitting')}
              isLoading={is('submit.submitting')}
              loadingText={t('Publishing')}
              onClick={() => {
                publishDrawerDisclosure.onOpen()
              }}
            >
              {t('Submit')}
            </PrimaryButton>
          )}
        </FlipMasterFooter>

        <BadFlipDialog
          isOpen={isOpenBadFlipDialog || !didShowBadFlip}
          title={t('What is a bad flip?')}
          subtitle={t(
            'Please read the rules carefully. You can lose all your validation rewards if any of your flips is reported.'
          )}
          epochNum={epochState?.epoch}
          onClose={async () => {
            localStorage.setItem('didShowBadFlipNew', true)
            send('SKIP_BAD_FLIP')
            onCloseBadFlipDialog()
          }}
        />

        <PublishFlipDrawer
          {...publishDrawerDisclosure}
          isPending={either('submit.submitting', 'submit.mining')}
          flip={{
            keywords: showTranslation ? keywords.translations : keywords.words,
            images: protectedImages,
            originalOrder,
            order,
          }}
          onSubmit={() => {
            send('SUBMIT')
          }}
        />
      </Page>
    </Layout>
  )
}
