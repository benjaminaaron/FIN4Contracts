import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import Container from '../../components/Container';
import Messages from '../Actions/Messages';
import Box from '../../components/Box';
import Table from '../../components/Table';
import TableRow from '../../components/TableRow';
import styled from 'styled-components';
import Currency from '../../components/Currency';
const axios = require('axios');

class Home extends Component {
	render() {
		return (
			<Container>
				<Messages />
				<Box title="Your token balances">
					{Object.keys(this.props.usersBalances).length === 0 ? (
						<NoTokens>You haven't sucessfully claimed any tokens yet.</NoTokens>
					) : (
						<Table headers={['Name', 'Balance']}>
							{Object.keys(this.props.usersBalances).map((tokenAddr, index) => {
								let token = this.props.store.getState().fin4Store.fin4Tokens[tokenAddr];
								return (
									<TableRow
										key={'balance_' + index}
										data={{
											name: <Currency symbol={token.symbol} name={token.name} />,
											balance: this.props.usersBalances[tokenAddr]
										}}
									/>
								);
							})}
						</Table>
					)}
				</Box>
				<Box title="About you">
					<p style={{ fontFamily: 'arial' }}>
						Your public address:
						<br />
						<small>
							{this.props.defaultAccount === null ? (
								'Info not yet available'
							) : (
								// TODO make network-generic
								<a href={'https://rinkeby.etherscan.io/address/' + this.props.defaultAccount} target="_blank">
									{this.props.defaultAccount}
								</a>
							)}
						</small>
					</p>
					<a
						href="#"
						onClick={() => {
							let url = window.location.href;
							// TODO make this URL slicing nicer!
							if (url.endsWith('#')) {
								url = url.substring(0, url.length - 1);
							}
							if (url.endsWith(':3000/')) {
								url = url.substr(0, url.length - 6);
							} else {
								// = http://demo.finfour.net/
								url = url.substring(0, url.length - 1);
							}
							let recipient = this.props.defaultAccount;
							let networkID = window.ethereum.networkVersion;
							let encodedURL = url + ':4000/faucet?recipient=' + recipient + '&networkID=' + networkID;
							console.log('Calling faucet server: ' + encodedURL);
							axios
								.get(encodedURL)
								.then(response => {
									console.log('Successfully called faucet server. Response: ' + response.data);
									alert(response.data);
								})
								.catch(error => {
									console.log('Error calling faucet server', error);
									alert('Failed to request Ether');
								})
								.finally(() => {});
						}}>
						<RequestEth>Request Ether</RequestEth>
					</a>
				</Box>
			</Container>
		);
	}
}

const RequestEth = styled.div`
	font-family: arial;
	font-size: small;
	color: gray;
`;

const NoTokens = styled.div`
	font-family: arial;
	text-align: center;
	color: silver;
`;

const mapStateToProps = state => {
	return {
		usersBalances: state.fin4Store.usersBalances,
		defaultAccount: state.fin4Store.defaultAccount
	};
};

export default drizzleConnect(Home, mapStateToProps);