/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import React, {useEffect, useState} from 'react'
import {
  Stack,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  useTheme,
  FormControl,
  Box,
  Flex,
  Button,
  Text,
  Switch,
  Radio,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Link,
  RadioGroup,
  Divider,
  useBreakpointValue,
  useClipboard,
} from '@chakra-ui/react'
import {useTranslation} from 'react-i18next'
import dayjs from 'dayjs'
import {useMachine} from '@xstate/react'
import {useQuery} from 'react-query'
import {InfoIcon} from '@chakra-ui/icons'
import {
  Avatar,
  Tooltip,
  FormLabel,
  Drawer,
  DrawerHeader,
  DrawerBody,
  Input,
  DrawerFooter,
  Toast,
  FormControlWithLabel,
  ExternalLink,
} from '../../shared/components/components'
import {rem} from '../../shared/theme'
import {
  FlatButton,
  PrimaryButton,
  SecondaryButton,
} from '../../shared/components/button'
import {IdentityStatus, NodeType} from '../../shared/types'
import {NotificationType} from '../../shared/providers/notification-context'
import {Notification, Snackbar} from '../../shared/components/notifications'
import {Spinner} from '../../shared/components/spinner'
import {
  loadPersistentState,
  loadPersistentStateValue,
} from '../../shared/utils/persist'
import {createTimerMachine} from '../../shared/machines'
import {usePersistence} from '../../shared/hooks/use-persistent-state'
import {useAuthState} from '../../shared/providers/auth-context'
import {Transaction} from '../../shared/models/transaction'
import {
  activateKey,
  getAvailableProviders,
  getRawTx,
  sendRawTx,
} from '../../shared/api'
import {
  privateKeyToAddress,
  privateKeyToPublicKey,
} from '../../shared/utils/crypto'
import {
  eitherState,
  mapIdentityToFriendlyStatus,
  openExternalUrl,
} from '../../shared/utils/utils'
import {useIdentity} from '../../shared/providers/identity-context'
import {useEpoch} from '../../shared/providers/epoch-context'
import {activateMiningMachine} from './machines'
import {fetchBalance} from '../../shared/api/wallet'
import {AddUserIcon, LaptopIcon, UserIcon} from '../../shared/components/icons'
import {useFailToast} from '../../shared/hooks/use-toast'
import useApikeyPurchasing from '../../shared/hooks/use-apikey-purchasing'
import useTx from '../../shared/hooks/use-tx'

export function UserInlineCard({address, state, ...props}) {
  return (
    <Stack
      direction={['column', 'row']}
      spacing={6}
      align="center"
      width={['200px', '480px']}
      wordBreak={['break-all', 'normal']}
      {...props}
    >
      <Avatar
        size={[
          ['160px', '160px'],
          ['88px', '80px'],
        ]}
        borderRadius={['48px', 'lg']}
        address={address}
      />
      <Stack spacing={1} align={['center', 'initial']}>
        <Heading as="h2" fontSize="lg" fontWeight={500} lineHeight="short">
          {mapIdentityToFriendlyStatus(state)}
        </Heading>
        <Heading
          as="h3"
          fontSize="mdx"
          fontWeight="normal"
          textAlign={['center', 'initial']}
          color="muted"
          lineHeight="shorter"
        >
          {address}
        </Heading>
      </Stack>
    </Stack>
  )
}

export function WideLink({
  label,
  href,
  onClick,
  isDisabled,
  children,
  ...props
}) {
  return (
    <Link
      w={['100%', 'auto']}
      px={[0, '12px']}
      borderRadius={[0, '6px']}
      href={href}
      opacity={isDisabled ? '0.5' : 1}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      onClick={isDisabled ? () => {} : onClick}
      _hover={{
        bg: 'blue.50',
      }}
      {...props}
    >
      <Flex h={[12, 8]} align="center" justify="flex-start">
        {children}
        <Box
          ml={[4, 2]}
          color="brandBlue.100"
          fontWeight={['400', '500']}
          fontSize={['base', 'md']}
        >
          {label}
        </Box>
      </Flex>
      <Divider
        display={['block', 'none']}
        w="263px"
        ml={12}
        color="brandGray.800"
      />
    </Link>
  )
}

export function UserStatList({title, children, ...props}) {
  return (
    <Stack spacing={[0, 4]} {...props} w={['311px', '100%']}>
      <Heading
        display={['none', 'block']}
        as="h4"
        fontSize="lg"
        fontWeight={500}
      >
        {title}
      </Heading>
      <Stack spacing={4} bg="gray.50" px={[7, 10]} py={[4, 8]} rounded="lg">
        <Heading
          display={['block', 'none']}
          as="h4"
          mt={['10px', 0]}
          fontSize="lg"
          fontWeight={500}
        >
          {title}
        </Heading>
        {children}
      </Stack>
    </Stack>
  )
}

export function SimpleUserStat({label, value, ...props}) {
  return (
    <UserStat {...props}>
      <UserStatLabel>{label}</UserStatLabel>
      <UserStatValue>{value}</UserStatValue>
    </UserStat>
  )
}

export function AnnotatedUserStat({
  annotation,
  label,
  value,
  children,
  ...props
}) {
  const {colors} = useTheme()
  return (
    <UserStat {...props}>
      <UserStatLabel borderBottom={`dotted 1px ${colors.muted}`} cursor="help">
        <UserStatLabelTooltip label={annotation}>{label}</UserStatLabelTooltip>
      </UserStatLabel>
      {value && <UserStatValue>{value}</UserStatValue>}
      {children}
    </UserStat>
  )
}

export function AnnotatedUserStatistics({
  annotation,
  label,
  value,
  children,
  ...props
}) {
  const {colors} = useTheme()
  return (
    <Flex
      fontSize={['mdx', 'md']}
      direction={['row', 'column']}
      justify={['space-between', 'flex-start']}
      {...props}
    >
      <Box
        w="fit-content"
        borderBottom={['none', `dotted 1px ${colors.muted}`]}
        cursor="help"
        fontWeight={['400', '500']}
        color={['auto', colors.muted]}
      >
        <UserStatLabelTooltip label={[annotation]}>
          {label}
        </UserStatLabelTooltip>
      </Box>
      {value && <Box fontWeight="500">{value}</Box>}
      {children}
    </Flex>
  )
}

export function UserStat(props) {
  return <Stat as={Stack} spacing="2px" {...props} />
}

export function UserStatistics({label, value, children, ...props}) {
  const {colors} = useTheme()
  return (
    <Flex
      fontSize={['mdx', 'md']}
      direction={['row', 'column']}
      justify={['space-between', 'flex-start']}
      {...props}
    >
      <Box fontWeight={['400', '500']} color={['auto', colors.muted]}>
        {label}
      </Box>
      <Box fontWeight="500">{value}</Box>
      {children}
    </Flex>
  )
}

export function UserStatLabel(props) {
  return (
    <StatLabel
      style={{display: 'inline-block'}}
      color="muted"
      alignSelf="flex-start"
      fontSize="md"
      lineHeight="short"
      {...props}
    />
  )
}

export function UserStatValue(props) {
  return (
    <StatNumber fontSize="md" fontWeight={500} lineHeight="base" {...props} />
  )
}

export function UserStatLabelTooltip(props) {
  return <Tooltip placement="top" zIndex="tooltip" {...props} />
}

export const ActivateInviteForm = React.forwardRef(function ActivateInviteForm(
  {onHowToGetInvitation, ...props},
  ref
) {
  const {t} = useTranslation()

  const failToast = useFailToast()
  const size = useBreakpointValue(['lg', 'md'])
  const placeholderValue = useBreakpointValue(['Invitation code', ''])

  const [{state}, {waitStateUpdate}] = useIdentity()
  const {coinbase, privateKey} = useAuthState()

  const [code, setCode] = React.useState('')
  const [submitting, setSubmitting] = useState(false)

  const [{mining}, setHash] = useTx()

  const {isPurchasing, needToPurchase, savePurchase} = useApikeyPurchasing()

  const sendActivateInviteTx = async () => {
    setSubmitting(true)
    const trimmedCode = code.trim()
    const from = trimmedCode
      ? privateKeyToAddress(trimmedCode)
      : privateKeyToAddress(privateKey)

    try {
      const rawTx = await getRawTx(
        1,
        from,
        coinbase,
        0,
        0,
        privateKeyToPublicKey(privateKey)
      )

      const tx = new Transaction().fromHex(rawTx)
      tx.sign(trimmedCode || privateKey)

      const hex = tx.toHex()

      if (needToPurchase) {
        const providers = await getAvailableProviders()

        const result = await activateKey(coinbase, `0x${hex}`, providers)
        savePurchase(result.id, result.provider)
      } else {
        const result = await sendRawTx(`0x${hex}`)
        setHash(result)

        // need to wait identity state update manually, because nothing changes in memory
        waitStateUpdate()
      }
    } catch (e) {
      failToast(
        `Failed to activate invite: ${
          e.response ? e.response.data : 'invitation is invalid'
        }`
      )
    } finally {
      setSubmitting(false)
    }
  }

  const waiting = submitting || isPurchasing || mining

  const hasBeenInvited = state === IdentityStatus.Invite

  return (
    <Box
      ref={ref}
      as="form"
      onSubmit={async e => {
        e.preventDefault()
        await sendActivateInviteTx(code)
      }}
      {...props}
    >
      {hasBeenInvited ? (
        <Flex justify="flex-end">
          <PrimaryButton
            isLoading={waiting}
            loadingText={t('Mining...')}
            type="submit"
          >
            {t('Accept invitation')}
          </PrimaryButton>
        </Flex>
      ) : (
        <Stack spacing={[4, 6]}>
          <FormControl>
            <Stack spacing={3}>
              <Flex
                display={['none', 'flex']}
                justify="space-between"
                align="center"
              >
                <FormLabel htmlFor="code" p={0} m={0}>
                  {t('Enter invitation code')}
                </FormLabel>
                <Button
                  variant="ghost"
                  isDisabled={waiting}
                  bg="unset"
                  color="muted"
                  fontWeight={500}
                  h="unset"
                  p={0}
                  _hover={{bg: 'unset'}}
                  _active={{bg: 'unset'}}
                  _focus={{boxShadow: 'none'}}
                  onClick={() =>
                    navigator.clipboard.readText().then(text => setCode(text))
                  }
                >
                  {t('Paste')}
                </Button>
              </Flex>
              <Input
                id="code"
                size={size}
                value={code}
                placeholder={placeholderValue}
                isDisabled={waiting}
                resize="none"
                _disabled={{
                  bg: 'gray.50',
                }}
                _placeholder={{
                  color: 'muted',
                }}
                onChange={e => setCode(e.target.value)}
              />
            </Stack>
          </FormControl>
          <Stack spacing={[0, 3]} isInline align="center" justify="flex-end">
            <Button
              display={['none', 'inline-flex']}
              variant="link"
              leftIcon={<InfoIcon boxSize={4} />}
              onClick={onHowToGetInvitation}
              colorScheme="blue"
              _active={{}}
              fontWeight={500}
            >
              {t('How to get an invitation?')}
            </Button>
            <Divider
              display={['none', 'block']}
              borderColor="gray.100"
              orientation="vertical"
              mx={4}
            />
            <PrimaryButton
              size={size}
              w={['100%', 'auto']}
              ml={[0, 'initial']}
              isLoading={waiting}
              loadingText={t('Mining...')}
              type="submit"
            >
              {t('Activate invite')}
            </PrimaryButton>
          </Stack>
        </Stack>
      )}
    </Box>
  )
})

export function ValidationResultToast({epoch}) {
  const timerMachine = React.useMemo(
    () =>
      createTimerMachine(
        dayjs(loadPersistentStateValue('validationResults', epoch)?.epochStart)
          .add(1, 'minute')
          .diff(dayjs(), 'second')
      ),
    [epoch]
  )
  const [current] = useMachine(timerMachine)

  const [state, dispatch] = usePersistence(
    React.useReducer(
      (prevState, seen) => ({
        ...prevState,
        [epoch]: {
          ...prevState[epoch],
          seen,
        },
      }),
      loadPersistentState('validationResults') || {}
    ),
    'validationResults'
  )

  const [{address, state: identityStatus}] = useIdentity()

  const isValidationSucceeded = [
    IdentityStatus.Newbie,
    IdentityStatus.Verified,
    IdentityStatus.Human,
  ].includes(identityStatus)

  const {t} = useTranslation()

  const {colors} = useTheme()

  const url = `https://scan.idena.io/identity/${address}/epoch/${epoch}/${
    isValidationSucceeded ? 'rewards' : 'validation'
  }`

  const notSeen =
    typeof state[epoch] === 'boolean'
      ? !state[epoch]
      : state[epoch] && !state[epoch].seen

  return notSeen ? (
    <Snackbar>
      {current.matches('running') && (
        <Notification
          pinned
          type={NotificationType.Info}
          icon={
            <Flex
              align="center"
              justify="center"
              css={{
                height: rem(20),
                width: rem(20),
                marginRight: rem(12),
              }}
            >
              <Box style={{transform: 'scale(0.35) translateY(-10px)'}}>
                <Spinner color={colors.brandBlue[500]} />
              </Box>
            </Flex>
          }
          title={t('Please wait for the validation report')}
        />
      )}
      {current.matches('stopped') && (
        <Notification
          pinned
          type={NotificationType.Info}
          title={
            isValidationSucceeded
              ? t('See your validation rewards in the blockchain explorer')
              : t('See your validation results in the blockchain explorer')
          }
          action={() => {
            dispatch(true)
            const win = openExternalUrl(url)
            win.focus()
          }}
          actionName={t('Open')}
        />
      )}
    </Snackbar>
  ) : null
}

export function ActivateMiningForm({
  privateKey,
  isOnline,
  delegatee,
  delegationEpoch,
  onShow,
}) {
  const toast = useToast()

  const epoch = useEpoch()
  const [, {waitOnlineUpdate, forceUpdate}] = useIdentity()

  const [current, send] = useMachine(activateMiningMachine, {
    context: {
      isOnline,
      delegatee,
      delegationEpoch,
      privateKey,
    },
    actions: {
      onError: (_, {data: {message}}) => {
        toast({
          status: 'error',
          // eslint-disable-next-line react/display-name
          render: () => <Toast title={message} status="error" />,
        })
      },
      waitIdentityUpdate: () => waitOnlineUpdate(),
      forceIdentityUpdate: () => forceUpdate(),
    },
  })
  const {mode} = current.context

  useEffect(() => {
    send('CANCEL')
  }, [isOnline, delegatee, send])

  const isDelegator = typeof delegatee === 'string'

  return (
    <>
      <ActivateMiningSwitch
        isOnline={isOnline || isDelegator}
        isDelegator={isDelegator}
        onShow={() => {
          send('SHOW')
          if (onShow) onShow()
        }}
      />
      {isOnline || isDelegator ? (
        <DeactivateMiningDrawer
          delegatee={delegatee}
          canUndelegate={epoch?.epoch > delegationEpoch}
          isOpen={eitherState(current, 'showing')}
          isCloseable={false}
          isLoading={eitherState(current, 'showing.mining')}
          onDeactivate={() => {
            send('DEACTIVATE', {
              mode: isDelegator ? NodeType.Delegator : NodeType.Miner,
            })
          }}
          onClose={() => {
            send('CANCEL')
          }}
        />
      ) : (
        <ActivateMiningDrawer
          mode={mode}
          isOpen={eitherState(current, 'showing')}
          isCloseable={false}
          isLoading={eitherState(current, 'showing.mining')}
          onChangeMode={value => {
            send({type: 'CHANGE_MODE', mode: value})
          }}
          // eslint-disable-next-line no-shadow
          onActivate={({delegatee}) => {
            send('ACTIVATE', {delegatee})
          }}
          onClose={() => {
            send('CANCEL')
          }}
        />
      )}
    </>
  )
}

export function ActivateMiningSwitch({isOnline, isDelegator, onShow}) {
  const {t} = useTranslation()

  const {colors} = useTheme()

  const accentColor = isOnline ? 'blue' : 'red'

  return (
    <Stack spacing={[0, 3]}>
      <Text display={['none', 'initial']} fontWeight={500} h={18}>
        {t('Status')}
      </Text>
      <Flex
        align="center"
        justify="space-between"
        borderColor="gray.100"
        borderWidth={[0, 1]}
        background={[
          isOnline ? 'rgba(87, 143, 255, 0.1)' : 'rgba(255, 102, 102, 0.1)',
          'initial',
        ]}
        rounded={['8px', 'md']}
        h={[12, 8]}
        px={[5, 3]}
      >
        <FormLabel
          htmlFor="mining"
          fontWeight="normal"
          fontSize={['mdx', 'md']}
          m={0}
        >
          {isDelegator ? t('Delegation') : t('Mining')}
        </FormLabel>
        <Stack isInline align="center">
          <Text color={`${accentColor}.500`} fontWeight={500}>
            {isOnline ? t('On') : t('Off')}
          </Text>
          <Switch
            id="mining"
            size="sm"
            isChecked={isOnline}
            colorScheme={accentColor}
            h={4}
            className="toggle"
            onChange={onShow}
          />
          <style jsx global>{`
            .toggle > input[type='checkbox']:not(:checked) + span {
              background: ${colors.red[500]};
            }
          `}</style>
        </Stack>
      </Flex>
    </Stack>
  )
}

export function ActivateMiningDrawer({
  isLoading,
  mode,
  onChangeMode,
  onActivate,
  onClose,
  ...props
}) {
  const {t} = useTranslation()

  const [delegatee, setDelegatee] = useState()
  const {onCopy, hasCopied} = useClipboard('https://www.idena.io/download')

  const sizeInput = useBreakpointValue(['lg', 'md'])
  const sizeButton = useBreakpointValue(['mdx', 'md'])
  const variantRadio = useBreakpointValue(['mobile', 'bordered'])
  const variantPrimary = useBreakpointValue(['primaryFlat', 'primary'])
  const variantSecondary = useBreakpointValue(['secondaryFlat', 'secondary'])

  return (
    <Drawer onClose={onClose} {...props}>
      <DrawerHeader>
        <Flex
          direction={['row', 'column']}
          justify={['space-between', 'flex-start']}
        >
          <Flex
            order={[2, 1]}
            align="center"
            justify="center"
            bg="blue.012"
            h={12}
            w={12}
            rounded="xl"
          >
            <UserIcon boxSize={6} color="blue.500" />
          </Flex>
          <Heading
            order={[1, 2]}
            color="brandGray.500"
            fontSize="lg"
            fontWeight={500}
            lineHeight="base"
            mt={['11px', 4]}
          >
            {t('Miner status')}
          </Heading>
        </Flex>
      </DrawerHeader>
      <DrawerBody>
        <Stack spacing={[6]} mt={[0, 30]}>
          <FormControl as={Stack} spacing={[1, 3]}>
            <FormLabel
              fontSize={['11px', '13px']}
              fontWieght={['400!important', '500']}
              color={['muted', 'initial']}
              mb={[0, 2]}
              p={0}
            >
              {t('Type')}
            </FormLabel>
            <RadioGroup
              isInline
              d="flex"
              flexDirection={['column', 'row']}
              value={mode}
              onChange={onChangeMode}
            >
              <Radio
                variant={variantRadio}
                value={NodeType.Miner}
                flex={['0 0 56px', 1]}
                fontSize={['base', 'md']}
                fontWeight={['500', '400']}
                px={[4, 2]}
                py={['18px', 2]}
                mr={2}
              >
                {t('Mining')}
              </Radio>
              <Radio
                variant={variantRadio}
                value={NodeType.Delegator}
                flex={['0 0 56px', 1]}
                fontSize={['base', 'md']}
                fontWeight={['500', '400']}
                px={[4, 2]}
                py={['18px', 2]}
              >
                {t('Delegation')}
              </Radio>
            </RadioGroup>
          </FormControl>
          {mode === NodeType.Delegator ? (
            <Stack spacing={5}>
              <FormControl as={Stack} spacing={[0, 3]}>
                <FormLabel fontSize={['base', 'md']}>
                  {t('Delegation address')}
                </FormLabel>
                <Input
                  size={sizeInput}
                  value={delegatee}
                  onChange={e => setDelegatee(e.target.value)}
                />
              </FormControl>
              <Alert
                status="error"
                rounded="md"
                bg="red.010"
                borderColor="red.050"
                borderWidth={1}
              >
                <AlertIcon name="info" alignSelf="flex-start" color="red.500" />
                <AlertDescription
                  as={Stack}
                  spacing={3}
                  color="brandGray.500"
                  fontSize="md"
                  fontWeight={500}
                >
                  <Text>
                    {t(
                      'You can lose your stake, all your mining and validation rewards if you delegate your mining status.'
                    )}
                  </Text>
                  <Text>
                    {t('You can disable delegation at the next epoch only.')}
                  </Text>
                </AlertDescription>
              </Alert>
            </Stack>
          ) : (
            <Stack spacing={[4, 5]}>
              <Text fontSize={['mdx', 'md']} mb={[0, 3]}>
                {t(
                  'To activate mining status please download the desktop version of Idena app'
                )}
              </Text>
              <Flex
                borderY={[0, '1px']}
                h={16}
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  '&': {
                    borderColor: 'gray.100',
                  },
                }}
              >
                <Flex w={['100%', 'auto']}>
                  <Stack
                    w={['100%', 'auto']}
                    spacing={[4, 2]}
                    isInline
                    align="center"
                    color="brand.gray"
                  >
                    <Flex
                      shrink={0}
                      boxSize={[8, 5]}
                      align="center"
                      justify="center"
                      backgroundColor={['brandGray.012', 'initial']}
                      borderRadius="10px"
                    >
                      <LaptopIcon boxSize={5} />
                    </Flex>
                    <Flex
                      direction="row"
                      w={['100%', 'auto']}
                      justify={['space-between', 'flex-start']}
                      borderBottom={['1px', 0]}
                      borderColor="gray.100"
                      lineHeight={['48px', 'auto']}
                    >
                      <Text as="span" fontSize={['base', 14]} fontWeight={500}>
                        {t('Desktop App')}
                      </Text>
                      {hasCopied ? (
                        <Text
                          display={['block', 'none']}
                          as="span"
                          color="green.500"
                          fontSize="base"
                          fontWeight={500}
                        >
                          Copied
                        </Text>
                      ) : (
                        <FlatButton
                          display={['block', 'none']}
                          onClick={onCopy}
                          fontWeight="500"
                        >
                          Copy link
                        </FlatButton>
                      )}
                    </Flex>
                  </Stack>
                </Flex>
                <Flex display={['none', 'flex']}>
                  <Link
                    href="https://www.idena.io/download"
                    target="_blank"
                    color="brandBlue.500"
                    rounded="md"
                    fontWeight={500}
                    fontSize={13}
                  >
                    {t('Download')}
                  </Link>
                </Flex>
              </Flex>
              <Flex
                rounded="md"
                bg="gray.50"
                borderColor="gray.50"
                borderWidth={1}
                px={6}
                py={4}
              >
                <Text color="muted" fontSize={['mdx', 'md']} lineHeight="20px">
                  {t(
                    'Use your private key backup to migrate your account. You can import your private key backup at the Settings page in Idena Desktop app.'
                  )}
                </Text>
              </Flex>
            </Stack>
          )}
        </Stack>
      </DrawerBody>
      <DrawerFooter mt={[6, 0]} px={0}>
        <Flex width="100%" justify={['space-evenly', 'flex-end']}>
          <Button
            variant={variantSecondary}
            order={[3, 1]}
            size={sizeButton}
            type="button"
            onClick={onClose}
          >
            {t('Cancel')}
          </Button>
          <Divider
            order="2"
            display={['block', 'none']}
            h={10}
            orientation="vertical"
            color="gray.100"
          />
          <Button
            variant={variantPrimary}
            order={[1, 3]}
            size={sizeButton}
            ml={[0, 2]}
            isDisabled={mode === NodeType.Miner}
            isLoading={isLoading}
            onClick={() => {
              onActivate({delegatee})
            }}
            loadingText={t('Waiting...')}
          >
            {t('Submit')}
          </Button>
        </Flex>
      </DrawerFooter>
    </Drawer>
  )
}

export function DeactivateMiningDrawer({
  isLoading,
  delegatee,
  canUndelegate,
  onDeactivate,
  onClose,
  ...props
}) {
  const {t} = useTranslation()

  const isDelegator = typeof delegatee === 'string'

  return (
    <Drawer onClose={onClose} {...props}>
      <DrawerHeader>
        <Flex
          align="center"
          justify="center"
          bg="blue.012"
          h={12}
          w={12}
          rounded="xl"
        >
          <UserIcon boxSize={6} color="blue.500" />
        </Flex>
        <Heading
          color="brandGray.500"
          fontSize="lg"
          fontWeight={500}
          lineHeight="base"
          mt={4}
        >
          {isDelegator
            ? t('Deactivate delegation status')
            : t('Deactivate mining status')}
        </Heading>
      </DrawerHeader>
      <DrawerBody>
        <Stack spacing={6} mt={30}>
          <Text fontSize="md">
            {isDelegator
              ? t(`Submit the form to deactivate your delegation status.`)
              : t(
                  `Submit the form to deactivate your mining status. You can activate it again afterwards.`
                )}
          </Text>
          {isDelegator && (
            <FormControl as={Stack} spacing={3}>
              <FormLabel>{t('Delegation address')}</FormLabel>
              <Input defaultValue={delegatee} isDisabled />
            </FormControl>
          )}
          {isDelegator && !canUndelegate && (
            <Alert
              status="error"
              rounded="md"
              bg="red.010"
              borderColor="red.050"
              borderWidth={1}
            >
              <AlertIcon name="info" alignSelf="flex-start" color="red.500" />
              <AlertDescription
                color="brandGray.500"
                fontSize="md"
                fontWeight={500}
              >
                {t('You can disable delegation at the next epoch only')}
              </AlertDescription>
            </Alert>
          )}
        </Stack>
      </DrawerBody>
      <DrawerFooter px={0}>
        <Stack isInline>
          <SecondaryButton onClick={onClose}>{t('Cancel')}</SecondaryButton>
          <PrimaryButton
            isDisabled={isDelegator && !canUndelegate}
            isLoading={isLoading}
            onClick={onDeactivate}
            loadingText={t('Waiting...')}
          >
            {t('Submit')}
          </PrimaryButton>
        </Stack>
      </DrawerFooter>
    </Drawer>
  )
}

// eslint-disable-next-line react/prop-types
export function KillForm({isOpen, onClose}) {
  const {t} = useTranslation()
  const {privateKey, coinbase} = useAuthState()
  const [, {killMe}] = useIdentity()
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const [to, setTo] = useState()

  const {
    data: {stake},
  } = useQuery(['get-balance', coinbase], () => fetchBalance(coinbase), {
    initialData: {balance: 0, stake: 0},
    enabled: !!coinbase,
  })

  const terminate = async () => {
    try {
      if (to !== coinbase)
        throw new Error(t('You must specify your own identity address'))

      setSubmitting(true)

      await killMe(privateKey)

      toast({
        status: 'success',
        // eslint-disable-next-line react/display-name
        render: () => <Toast title={t('Transaction sent')} />,
      })
      if (onClose) onClose()
    } catch (error) {
      toast({
        // eslint-disable-next-line react/display-name
        render: () => (
          <Toast
            title={error?.message ?? t('error:Error while sending transaction')}
            status="error"
          />
        ),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <DrawerHeader mb={6}>
        <Avatar address={coinbase} mx="auto" />
        <Heading
          fontSize="lg"
          fontWeight={500}
          color="brandGray.500"
          mt={4}
          mb={0}
          textAlign="center"
        >
          {t('Terminate identity')}
        </Heading>
      </DrawerHeader>
      <DrawerBody>
        <Text fontSize="md" mb={6}>
          {t(`Terminate your identity and withdraw the stake. Your identity status
            will be reset to 'Not validated'.`)}
        </Text>
        <FormControlWithLabel label={t('Withraw stake, iDNA')}>
          <Input value={stake} isDisabled />
        </FormControlWithLabel>
        <Text fontSize="md" mb={6} mt={6}>
          {t(
            'Please enter your identity address to confirm termination. Stake will be transferred to the identity address.'
          )}
        </Text>
        <FormControlWithLabel label={t('Address')}>
          <Input value={to} onChange={e => setTo(e.target.value)} />
        </FormControlWithLabel>
      </DrawerBody>
      <DrawerFooter>
        <Box
          alignSelf="stretch"
          borderTop="1px"
          borderTopColor="gray.100"
          mt="auto"
          pt={5}
          width="100%"
        >
          <Stack isInline spacing={2} justify="flex-end">
            <PrimaryButton
              onClick={terminate}
              isLoading={submitting}
              colorScheme="red"
              _hover={{
                bg: 'rgb(227 60 60)',
              }}
              _active={{
                bg: 'rgb(227 60 60)',
              }}
              _focus={{
                boxShadow: '0 0 0 3px rgb(255 102 102 /0.50)',
              }}
            >
              {t('Terminate')}
            </PrimaryButton>
          </Stack>
        </Box>
      </DrawerFooter>
    </Drawer>
  )
}
