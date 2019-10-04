import { Fin4MainAddress } from '../config/DeployedAddresses.js';
import {
	ADD_MULTIPLE_FIN4_TOKENS,
	ADD_MULTIPLE_CLAIMS,
	UPDATE_MULTIPLE_BALANCES,
	ADD_MULTIPLE_PROOF_TYPES,
	SET_USERS_ETH_BALANCE
} from '../middleware/actionTypes';
import Web3 from 'web3';

const BN = require('bignumber.js');
const web3 = new Web3(window.ethereum);

// DEPRECATED
const getCurrentAccount = () => {
	return null;
};

// TODO reuse them instead of instantiating them repeatedly
const getContract = (contractAddress, contractName) => {
	const json = require('../build/contracts/' + contractName + '.json');
	return new web3.eth.Contract(json.abi, contractAddress);
};

const getContractData = (props, contractAddress, contractName, method, methodArgs) => {
	let contract = getContract(contractAddress, contractName);
	let defaultAccount = props.store.getState().fin4Store.defaultAccount;
	if (methodArgs === undefined) {
		return contract.methods[method]().call({
			from: defaultAccount
		});
	} else {
		return contract.methods[method](methodArgs).call({
			from: defaultAccount
		});
	}
};

let initialDataLoaded = false;

const loadInitialDataIntoStore = props => {
	if (initialDataLoaded) {
		return;
	}
	initialDataLoaded = true;

	// TCR addresses
	// getTCRAddresses(props);

	getUsersBalance(props);

	// get proof types
	getAllProofTypes(props, () => {
		// get tokens
		getAllFin4Tokens(props, () => {
			// get current users nonzero balances, TODO how to handle change of user in MetaMask?
			getMyNonzeroTokenBalances(props);
			getAllCurrentUsersClaims(props);
		});
	});
};

const getUsersBalance = props => {
	let currentAccount = props.store.getState().fin4Store.defaultAccount;
	window.web3.eth.getBalance(currentAccount, (err, res) => {
		if (err) {
			return;
		}
		let eth = window.web3.toDecimal(window.web3.fromWei(res, 'ether'));
		props.dispatch({
			type: SET_USERS_ETH_BALANCE,
			balance: eth
		});
	});
};

/* const getTCRAddresses = props => {
	getContractData(Fin4MainAddress, 'Fin4Main', 'getTCRaddresses').then(
		({ 0: REPToken, 1: GOVToken, 2: Registry, 3: PLCRVoting }) => {
			props.dispatch({
				type: ADD_ADDRESS,
				name: 'REPToken',
				address: REPToken
			});
			props.dispatch({
				type: ADD_ADDRESS,
				name: 'GOVToken',
				address: GOVToken
			});
			props.dispatch({
				type: ADD_ADDRESS,
				name: 'Registry',
				address: Registry
			});
			props.dispatch({
				type: ADD_ADDRESS,
				name: 'PLCRVoting',
				address: PLCRVoting
			});
		}
	);
};*/

const getAllFin4Tokens = (props, callback) => {
	getContractData(props, Fin4MainAddress, 'Fin4Main', 'getAllFin4Tokens')
		.then(tokens => {
			return tokens.map(address => {
				return getContractData(props, address, 'Fin4Token', 'getInfo').then(
					({ 0: name, 1: symbol, 2: description, 3: unit }) => {
						return {
							address: address,
							name: name,
							symbol: symbol,
							description: description,
							unit: unit
						};
					}
				);
			});
		})
		.then(promises => Promise.all(promises))
		.then(tokenArr => {
			props.dispatch({
				type: ADD_MULTIPLE_FIN4_TOKENS,
				tokenArr: tokenArr
			});
			callback();
		});
};

const getMyNonzeroTokenBalances = props => {
	getContractData(props, Fin4MainAddress, 'Fin4Main', 'getMyNonzeroTokenBalances').then(
		({ 0: nonzeroBalanceTokens, 1: balancesBN }) => {
			if (nonzeroBalanceTokens.length === 0) {
				return;
			}
			props.dispatch({
				type: UPDATE_MULTIPLE_BALANCES,
				tokenAddresses: nonzeroBalanceTokens,
				balances: balancesBN.map(balanceBN => new BN(balanceBN).toNumber())
			});
		}
	);
};

const getAllProofTypes = (props, callback) => {
	getContractData(props, Fin4MainAddress, 'Fin4Main', 'getProofTypes')
		.then(proofTypeAddresses => {
			return proofTypeAddresses.map(proofTypeAddress => {
				return getContractData(props, Fin4MainAddress, 'Fin4Main', 'getProofTypeName', proofTypeAddress).then(
					proofTypeName => {
						return getContractData(props, proofTypeAddress, proofTypeName, 'getInfo').then(
							({ 0: name, 1: description, 2: parameterForActionTypeCreatorToSetEncoded }) => {
								return {
									value: proofTypeAddress,
									label: name,
									description: description,
									paramsEncoded: parameterForActionTypeCreatorToSetEncoded,
									paramValues: {}
								};
							}
						);
					}
				);
			});
		})
		.then(data => Promise.all(data))
		.then(data => {
			props.dispatch({
				type: ADD_MULTIPLE_PROOF_TYPES,
				proofTypesArr: data
			});
			callback();
		});
};

const getAllCurrentUsersClaims = props => {
	getContractData(props, Fin4MainAddress, 'Fin4Main', 'getActionsWhereUserHasClaims')
		.then(tokenAddresses => {
			return tokenAddresses.map(tokenAddr => {
				return getContractData(props, tokenAddr, 'Fin4Token', 'getMyClaimIds').then(claimIds => {
					return claimIds.map(claimId => {
						return getContractData(props, tokenAddr, 'Fin4Token', 'getClaim', claimId).then(
							({
								0: tokenName,
								1: tokenSymbol,
								2: claimer,
								3: isApproved,
								4: quantityBN,
								5: dateBN,
								6: comment,
								7: requiredProofTypes,
								8: proofStatusesBool
							}) => {
								let proofStatusesObj = {};
								for (let i = 0; i < requiredProofTypes.length; i++) {
									proofStatusesObj[requiredProofTypes[i]] = proofStatusesBool[i];
								}
								return {
									id: tokenAddr + '_' + claimId, // pseudoId
									token: tokenAddr,
									claimId: claimId,
									claimer: claimer,
									isApproved: isApproved,
									quantity: new BN(quantityBN).toNumber(),
									date: new BN(dateBN).toNumber(),
									comment: comment,
									proofStatuses: proofStatusesObj
								};
							}
						);
					});
				});
			});
		})
		.then(promises => Promise.all(promises))
		.then(data => data.flat())
		.then(promises => Promise.all(promises))
		.then(claimArr => {
			props.dispatch({
				type: ADD_MULTIPLE_CLAIMS,
				claimArr: claimArr
			});
		});
};

const findTokenBySymbol = (props, symb) => {
	let symbol = symb.toUpperCase();
	let keys = Object.keys(props.fin4Tokens);
	for (let i = 0; i < keys.length; i++) {
		let token = props.fin4Tokens[keys[i]];
		if (token.symbol === symbol) {
			return token;
		}
	}
	return null;
};

// DEPRECATED
const getAllActionTypes = () => {
	return getContractData(Fin4MainAddress, 'Fin4Main', 'getAllFin4Tokens')
		.then(tokens => {
			return tokens.map(address => {
				return getContractData(address, 'Fin4Token', 'getInfo').then(({ 0: name, 1: symbol, 2: description }) => {
					return {
						value: address,
						label: `[${symbol}] ${name}`
					};
				});
			});
		})
		.then(data => Promise.all(data));
};

const getPollStatus = pollID => {
	// pollID is also called challengeID in Registry.sol
	return getContractData('PLCRVotingAddress-DUMMY', 'PLCRVoting', 'pollMap', [pollID]).then(
		({ 0: commitEndDateBN, 1: revealEndDateBN, 2: voteQuorum, 3: votesFor, 4: votesAgainst }) => {
			let commitEndDate = new BN(commitEndDateBN).toNumber() * 1000;
			let revealEndDate = new BN(revealEndDateBN).toNumber() * 1000;
			let nowTimestamp = Date.now();

			if (commitEndDate - nowTimestamp > 0) {
				return {
					inPeriod: PollStatus.IN_COMMIT_PERIOD,
					dueDate: new Date(commitEndDate).toLocaleString('de-CH-1996') // choose locale automatically?
				};
			}

			if (revealEndDate - nowTimestamp > 0) {
				return {
					inPeriod: PollStatus.IN_REVEAL_PERIOD,
					dueDate: new Date(revealEndDate).toLocaleString('de-CH-1996')
				};
			}

			return {
				inPeriod: PollStatus.PAST_REVEAL_PERIOD,
				dueDate: ''
			};
		}
	);
};

const PollStatus = {
	IN_COMMIT_PERIOD: 'Commit Vote',
	IN_REVEAL_PERIOD: 'Reveal',
	PAST_REVEAL_PERIOD: '-'
};

export {
	getCurrentAccount,
	getContractData,
	getContract,
	getAllActionTypes,
	getPollStatus,
	PollStatus,
	loadInitialDataIntoStore,
	findTokenBySymbol
};
