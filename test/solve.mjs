import t from 'tap';
import { solve } from '../index.mjs';

t.test('invalid challenge', t => {
    t.throws(() => solve(undefined), {message:'Malformed challenge: must have .c, .m, and .d'}, 'should reject with invalid challenge');
    t.throws(() => solve(null), {message:'Malformed challenge: must have .c, .m, and .d'}, 'should reject with invalid challenge');
    t.throws(() => solve({}), {message:'Malformed challenge: must have .c, .m, and .d'}, 'should reject with invalid challenge');
    t.throws(() => solve({c:123, d:123, m:123}), {message:'Malformed challenge: must have .c, .m, and .d'}, 'should reject with invalid challenge');
    t.throws(() => solve({c:'0x123', d:'foo', m:123}), {message:'Malformed challenge: must have .c, .m, and .d'}, 'should reject with invalid challenge');
    t.throws(() => solve({c:'0x123', d:123, m:'foo'}), {message:'Malformed challenge: must have .c, .m, and .d'}, 'should reject with invalid challenge');

    t.end();
});


const vectors = [
    {
        challenge: { c: '0x4e6d0a8496dd396958e303c4cc0ae3e6', d: 200, m: 521 },
        solution: { s: '0x1052c2019bced2933bd694785a21d9792334851ac103552e2936622caf3cd8018656706493b775f63ed03af56dc69aa532d08623909a7a2333d6289b4d794ebe6c3' }
    },
    {
        challenge: { c: '0x91c55b1a85853a8e6de551995abedbe9', d: 50, m: 1279 },
        solution: { s: '0x10b40014cbcde369432d9af5a5e92671420f7bfea4d22d18c4fa68259d5a814f8e5660f3d953857470c7dcacfcbd4b714fbf389c964875730100606919cf4ff006bebd6dac668ff0c70ef1383655d52b8202463d9eee5ad7c059650c19a15a0668b10a9e71a5015b57bbb96028d1fb2711647ce6928a19a8324fd4cd296623f51b49e3235b293935c38a46b70396b3e3e65f9e48c275a876f87b2ed9d90b5bb4' }
    },
    {
        challenge: {c: '0x73ec63c4b22443642e295bbf034177ff', d: 128, m: 1279 },
        solution: { s: '0x3e6b9be971bc76ddb92ef6418e643e3792beaa7f4c7ae57ae0c839e143f68152be07cdd3f9d78ff6569b790b84b65380c082d3164a8273ce63509ee473100eca1830e9affd7bb57a306d6cdb8779d8422212ec10f9af2faa965b6555230886fcce070832bd1e49fbfbdda1fee5fa610b6bd7a595359c6f38a07ecee8612a038cfebe49d756af701e4a7bde3afc4353e63c80e0efb8795021637ef3957d79388c'}
    },
    {
        challenge: { c: '0x3763e9cb482e286c854e7683c85ef8f7', d: 5, m: 9689 },
        solution: { s:'0x7fa26535807a55d509617e2c7ce52c2b7457a18c0cfe069b996bf558643c137c3a8c558d5cbe6c42a9bb27d564c9caff46b4eba93adc7828a3b5e305488e87f2fc9ba0de6db6e769b249f7fdd76203a178325a8cb68abefa1a1b2a9f7a27735acd60bf46e8881815185275ace9db45f90f302fcac357f3b97a73859b834983c0b25820fb9aac8d9c382f613f36fe54fa7ad21a29ad69ea5bfc42dc4b052f20612196c584ce744857f999614abc57fbb4da53ade77a2e8ae25bfa0109cb081fd22be6e1c3e38fd2aa8765d2ab8defe83842d3ea5c58e3a126d37af1d74f90f07a9d1032dcc4c20906979cd95874163c31ab3eff9b2544f8c24c63f7a899dd2ca4549ab662f276ad7e0f684efdfd73151df702ae6160ccca8aec860efc288902a984fd21b8072e39876184e68d456750798704ff3ef5b20232c78e32bde09d244aae42c5e0cfcf6811e1e0b0811cf5fd77d5324296dea041a8289df10ad160f4789f4e258544fa2c19ae7668d6099698d4c43854f135b12d87e5f64cac03a2db7e2404ab511d4f64a6736ac614c54b0704d5c5783d600c3b07b04d3ede4591151fba1e2797280bb166bb6f2c42b19e0027c382f28b8686ba29d06f164fc4bded59f4367d99f49c28017f094594711cf3f84de0db6bd0c16fa78ea4165a5e4563c0c8df75d266ae8f046b436e6f4f3137c4446b887c4be01f4e55912da00a5dc11b70185cb7102430203d7cec07e52e9098268f813a64c27e7c48ce98e4b8963fa8b1830769cd3a7795144342a1ed1eff8fe98a86aba816f23f9a00f620f35c73dd0fd29d65e5e78c7e142a4d615ae1e3163d4042b1d1f96504bc68f08869adfa0f4afe4314d0888978a0d1c5c21bdb131fbffe9594279bf753662e323ae796d4facb5e327322249ea9177aa6ba7fdd0444b9ad54c1d35ddaeebabedda6731c0f2a0028fe33010979bfa087b280dbd2af2a4648ab0d9e81da0a30dc5fca8e0e8c7086bebe6955d65948fd39d6d7c68dece9e3b6e6727c607ca2b092baa57d51b33b9ae831892c5e78a3d72608dac3967677b4705123b5de2fdfc86b4a9a2d1926cc8dfd6c08366ce43b2b5d7571ff657bf1428b11db9df21bc5754cb45c0df500e40c17c33bd9071d84e563b8363a2ed011a91fedfb29f403924e8dba9e4b04447f13d1b369088325e8e65260f64e7bf8553ae103b022d5de5abaa9b44854c9a17409bd17e7215e47f2c650fa6d1dd26ce28ab7007c4fe5a0019eb9e1eeb1e77a3d982152cd54bfdbbc194f88207d89994959e37fc0c36452ba56b863ea1867c7a5760650f09cba829ce707f77ca8b63e85b315e0d299d31945f6633ba6e6a798d8430ac2b8e1456bb98bb512c1c24d4c487916108f930708c04b6ae61aa5d2dfbafb54d871e07b0a98bed8d71fad3f63a5f5bdae4315a970debc1e62c13562aa5be223ce13318dbcaa95f74ef354c6d000dfa4c28cf2a3fa7fd7deca7beaaddc14bf171013b3a5f4d6a6ab17364dd19d7821e2e2475f78bb3d2af76bb87734dbacfbb1dafb9afab07ca830501104f5828ead63e80e1b3ac0eb4d3ae2d3aed24acd4d4031a56edaced02ec6f7b44e4fe329ebdeb8a2d6d02f977e7660b6ad72296195f49624c3e829a41b59dc3722429c9ac282df3ff6ad74e3924ddd3a5191378d982a09d32512cfa42370e3daeff247d797cfc937319f7f59c19ba' }
    }
];


t.test('sovles test vectors', t => {
    t.plan(vectors.length);

    for (const {challenge, solution} of vectors) {
        t.test(`test vector m=${challenge.m}, difficulty=${challenge.d}`, t => {
            t.plan(1);
            const solved = solve(challenge);
            t.match(solved, solution, 'expected correct solution');
        });
    }

});
