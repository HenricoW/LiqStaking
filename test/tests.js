const TokenStaking = artifacts.require("TokenStaking.sol")
const UnderlyingToken = artifacts.require("UnderlyingToken.sol")
const GovernanceToken = artifacts.require("GovernanceToken.sol")
const { time } = require('@openzeppelin/test-helpers')

const wait = async (duration) => (new Promise((res, _) => setTimeout(res, duration * 1000)))

contract('tests', accounts => {
    [admin, trader1, trader2, _] = accounts
    let uToken, gToken, staker;

    beforeEach(async () => {
        [uToken, gToken] = await Promise.all([
            await UnderlyingToken.new(),
            await GovernanceToken.new()
        ])
        staker = await TokenStaking.new(uToken.address, gToken.address)

        // mint tokens for the traders
        await uToken.faucet(web3.utils.toWei('1000'), { from: trader1 })
        await uToken.faucet(web3.utils.toWei('1000'), { from: trader2 })

        // transfer ownership of gtoken to staker
        await gToken.transferOwnership(staker.address);

        // approve staker on both tokens
        await uToken.approve(staker.address, web3.utils.toWei('1000'), { from: trader1 })
        await uToken.approve(staker.address, web3.utils.toWei('1000'), { from: trader2 })
    });

    // it should mint 400 'LP' Tokens
    it('Should mint 400 LP tokens', async () => {
        // deposit utoken to staker
        await staker.deposit(web3.utils.toWei('100'), { from: trader1 })
        const uBalb4 = await uToken.balanceOf(trader1)
        console.log("underlying after deposit: ", web3.utils.fromWei(uBalb4))

        // wait a few blocks
        await time.advanceBlock()
        await time.advanceBlock()
        await time.advanceBlock()

        const LPbal = await staker.balanceOf(trader1)
        console.log("LP after deposit: ", web3.utils.fromWei(LPbal));
        const gBal = await gToken.balanceOf(trader1)
        console.log("govToken after deposit: ", web3.utils.fromWei(gBal))

        // withdraw form staker
        await staker.withdraw(LPbal, { from: trader1 })

        // check balance on utoken (restored?)
        const uBal = await uToken.balanceOf(trader1)
        console.log("underlying after withdrawal: ", web3.utils.fromWei(uBal))
        const LPbala = await staker.balanceOf(trader1)
        console.log("LP after withdrawal: ", web3.utils.fromWei(LPbala));
        // check balance on gtoken (correct amount)
        const gBala = await gToken.balanceOf(trader1)
        console.log("govToken after withdrawal: ", web3.utils.fromWei(gBala))
        assert(web3.utils.fromWei(gBala) === '400')
    });

    // it should mint 400 'LP' Tokens
    it('Should mint 600 LP tokens', async () => {
        // deposit utoken to staker
        await staker.deposit(web3.utils.toWei('100'), { from: trader1 })
        const uBalb4 = await uToken.balanceOf(trader1)
        console.log("")
        console.log("underlying after deposit: ", web3.utils.fromWei(uBalb4))

        // wait a few blocks
        await time.advanceBlock()
        await time.advanceBlock()
        await time.advanceBlock()
        await time.advanceBlock()
        await time.advanceBlock()

        const LPbal = await staker.balanceOf(trader1)
        console.log("LP after deposit: ", web3.utils.fromWei(LPbal))

        // deposit utoken to staker
        await staker.deposit(web3.utils.toWei('100'), { from: trader1 })

        // check balance on utoken (restored?)
        const uBal = await uToken.balanceOf(trader1)
        console.log("underlying after deposit#2: ", web3.utils.fromWei(uBal))
        const LPbala = await staker.balanceOf(trader1)
        console.log("LP after deposit#2: ", web3.utils.fromWei(LPbala))
        // check balance on gtoken (correct amount)
        const gBala = await gToken.balanceOf(trader1)
        assert(web3.utils.fromWei(gBala) === '600')
    });
})