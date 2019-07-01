import React, { Component } from 'react';
import { Box } from '../../Styles';
import ContractData from '../../ContractData';

class PreviousClaims extends Component {
	showClaim = (data, args) => {
		const tokenAddress = args[0];
		const tokenName = args[1];
		const tokenSymbol = args[2];
		const claimId = args[3];
		// var claimer = data[0];
		const isApproved = data[1];
		const quantity = data[2];
		const date = data[3];
		const comment = data[4];
		return (
			<li key={`${tokenAddress}-${claimId}`}>
				<font color="gray">{date}</font>&nbsp;
				<b>{tokenName}</b> [{tokenSymbol}] ({quantity}), {comment}
				{!isApproved ? (
					<span>
						&nbsp;>> <a href={`/proof?tokenAddress=${tokenAddress}&claimId=${claimId}`}>submit proof</a>
					</span>
				) : (
					''
				)}
			</li>
		);
	};

	getMyClaimIds = data => {
		var tokenAddress = data[0];
		var tokenName = data[1];
		var tokenSymbol = data[2];
		var claimIds = data[3];
		return (
			claimIds &&
			claimIds.map((claimId, index) => {
				return (
					<ContractData
						key={index}
						contractAddress={tokenAddress}
						method="getClaimInfo"
						methodArgs={[claimId]}
						callback={this.getClaimInfo}
						callbackArgs={[tokenAddress, tokenName, tokenSymbol, claimId]}
					/>
				);
			})
		);
	};

	getActionsWhereUserHasClaims = data => {
		const claims = data
			? data.map((address, index) => {
					return (
						<ContractData key={index} contractAddress={address} method="getMyClaimIds" callback={this.getMyClaimIds} />
					);
			  })
			: [];
		return <ul>{claims}</ul>;
	};

	render() {
		return (
			<Box title="My Previous Claims">
				<ContractData
					contractName="Fin4Main"
					method="getActionsWhereUserHasClaims"
					callback={this.getActionsWhereUserHasClaims}
				/>
			</Box>
		);
	}
}

export default PreviousClaims;
