<div class="header">
    <a class="brand" href="/">War Era Stats</a>

    <nav aria-label="Main navigation">
        <a href="/items">Items</a>
    </nav>
</div>

<style lang="scss">
    div.header {
        height: 60px;
        background-color: #0e0e0e;
        border-bottom: #454545 1px solid;

        display: flex;
        align-items: center;

        a.brand {
            text-transform: uppercase;
            color: #fff;
            font-family: "Inter", sans-serif;
            margin: 0;
            padding-left: 2rem;
            font-size: 20px;
            font-weight: 800;
            text-decoration: none;
            flex: 1;

            &:hover {
                color: #4af0c0;
            }
        }

        nav {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-right: 1rem;

            a {
                color: #c2c6d6;
                text-decoration: none;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 700;
                padding: 6px 10px;
                border: 1px solid #353535;
                border-radius: 4px;

                &:hover {
                    color: #fff;
                    border-color: #4af0c0;
                }
            }
        }
    }
</style>
