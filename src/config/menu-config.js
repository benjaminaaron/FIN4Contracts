import AccountIcon from '@material-ui/icons/AccountCircle';
import AddIcon from '@material-ui/icons/AddCircle';
import ListIcon from '@material-ui/icons/ViewList';

import Account from '../views/Account/Account';
import ClaimSubmission from '../views/ActionClaim/ClaimSubmission';
import Claims from '../views/ListOfClaims/Claims';
import NewToken from '../views/TokenCreation/NewToken';

const menu = [
	{ component: Account, path: '/me', label: 'Me', icon: AccountIcon },
	{
		component: NewToken,
		path: '/create-action-type',
		label: 'Create Action Type',
		icon: AddIcon
	},
	{
		component: ClaimSubmission,
		path: '/claim-action',
		label: 'Claim Action',
		icon: AddIcon
	},
	{ component: Claims, path: '/history', label: 'History', icon: ListIcon }
];

export default menu;
