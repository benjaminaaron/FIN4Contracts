#!/bin/bash

#rm -rf src/build  --> the --reset flag apparently does that
rm src/config/deployedAddresses.json

rm -r src/build
truffle compile
truffle migrate --reset > out

Fin4Main_adr=`grep -A4 Fin4Main out | grep contract | cut -c 27-`
ProofDummy_adr=`grep -A4 ProofDummy out | grep contract | cut -c 27-`

echo Fin4Main deployed at: $Fin4Main_adr
echo ProofDummy deployed at: $ProofDummy_adr

json="{\n
\t\"Fin4Main\": \"$Fin4Main_adr\",\n
\t\"ProofDummy\": \"$ProofDummy_adr\"\n
}"

echo -e ${json} > src/config/deployed-addresses.json

rm out